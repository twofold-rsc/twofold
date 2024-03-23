import { readFirstNBytes } from "./helpers/file.js";
import { externalPackages } from "./externals.js";
import { BuildContext, context, transform } from "esbuild";
import { createHash } from "crypto";
import { basename, extname } from "path";
import { readFile } from "fs/promises";
import { ParseResult, parseAsync } from "@babel/core";
import { frameworkSrcDir } from "../files.js";
import { fileURLToPath } from "url";

type ClientComponentModule = {
  moduleId: string;
  path: string;
  exports: string[];
};

type ServerActionModule = {
  moduleId: string;
  path: string;
  exports: string[];
  exportsAndNames: { export: string; local: string }[];
};

let clientMarker = '"use client";';
let serverMarker = '"use server";';
let markers = [clientMarker, serverMarker];

export class EntriesBuilder {
  #context?: BuildContext;
  #error?: Error;

  #clientComponentModuleMap = new Map<string, ClientComponentModule>();
  #serverActionModuleMap = new Map<string, ServerActionModule>();

  get clientComponentModuleMap() {
    return this.#clientComponentModuleMap;
  }

  get serverActionModuleMap() {
    return this.#serverActionModuleMap;
  }

  get error() {
    return this.#error;
  }

  async setup() {
    let frameworkComponentsUrl = new URL("./components/", frameworkSrcDir);
    let frameworkComponentsPath = fileURLToPath(frameworkComponentsUrl);

    let builder = this;
    this.#context = await context({
      entryPoints: [
        "./src/**/*.ts",
        "./src/**/*.tsx",
        `${frameworkComponentsPath}/**/*.tsx`,
      ],
      bundle: true,
      platform: "neutral",
      logLevel: "error",
      entryNames: "entries/[name]-[hash]",
      metafile: true,
      write: false,
      outdir: "./.twofold/temp/",
      outbase: "src",
      external: ["react", "react-dom", "node:*", ...externalPackages],
      plugins: [
        {
          name: "find-entry-points-plugin",
          setup(build) {
            let maxBytes = markers
              .map((marker) => marker.length)
              .reduce((a, b) => Math.max(a, b), 0);

            build.onLoad({ filter: /\.(tsx|ts|jsx|js)$/ }, async ({ path }) => {
              let contents = await readFirstNBytes(path, maxBytes);

              if (contents === clientMarker || contents === serverMarker) {
                if (contents === clientMarker) {
                  let module = await pathToClientComponentModule(path);
                  builder.#clientComponentModuleMap.set(path, module);
                } else if (contents === serverMarker) {
                  let module = await pathToServerActionModule(path);
                  builder.#serverActionModuleMap.set(path, module);
                }
              }

              return null;
            });
          },
        },
      ],
    });
  }

  async build() {
    if (!this.#context) {
      throw new Error("setup must be called before build");
    }

    this.#clientComponentModuleMap = new Map();
    this.#serverActionModuleMap = new Map();
    this.#error = undefined;

    try {
      await this.#context.rebuild();
    } catch (e: unknown) {
      console.log(e);

      if (e instanceof Error) {
        this.#error = e;
      } else {
        this.#error = new Error("Unknown error");
      }
    }
  }
}

async function pathToClientComponentModule(path: string) {
  let moduleId = getModuleId(path);
  let ast = await getAst(path);

  return {
    moduleId,
    path,
    exports: getExports(ast),
  };
}

async function pathToServerActionModule(path: string) {
  let moduleId = getModuleId(path);
  let ast = await getAst(path);

  return {
    moduleId,
    path,
    exports: getExports(ast),
    exportsAndNames: getExportsAndNames(ast),
  };
}

function getModuleId(path: string) {
  let md5 = createHash("md5").update(path).digest("hex");
  let name = basename(path, extname(path));
  let moduleId = `${name}-${md5}`;
  return moduleId;
}

async function getAst(path: string) {
  let contents = await readFile(path, "utf-8");

  let { code } = await transform(contents, {
    loader: "tsx",
    jsx: "automatic",
    format: "esm",
  });

  let ast = await parseAsync(code);

  return ast;
}

function getExports(ast: ParseResult | null) {
  let exports =
    ast?.program.body.reduce<string[]>((exports, node) => {
      if (node.type === "ExportNamedDeclaration") {
        return [
          ...exports,
          ...node.specifiers.map((specifier) =>
            specifier.exported.type === "Identifier"
              ? specifier.exported.name
              : specifier.exported.value,
          ),
        ];
      } else if (node.type === "ExportDefaultDeclaration") {
        return [...exports, "default"];
      } else {
        return exports;
      }
    }, []) ?? [];

  return exports;
}

function getExportsAndNames(ast: ParseResult | null) {
  let exports =
    ast?.program.body.reduce<{ export: string; local: string }[]>(
      (exports, node) => {
        if (node.type === "ExportNamedDeclaration") {
          let functionExports = [];

          for (let specifier of node.specifiers) {
            if (
              specifier.type === "ExportSpecifier" &&
              specifier.exported.type === "Identifier"
            ) {
              functionExports.push({
                export: specifier.exported.name,
                local: specifier.local.name,
              });
            }
          }

          return [...exports, ...functionExports];
        }

        return exports;
      },
      [],
    ) ?? [];

  return exports;
}
