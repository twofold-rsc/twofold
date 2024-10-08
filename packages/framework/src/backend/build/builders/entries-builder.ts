import { readFirstNBytes } from "../helpers/file.js";
import { externalPackages } from "../externals.js";
import { BuildContext, context, transform } from "esbuild";
import { createHash } from "crypto";
import { basename, extname } from "path";
import { readFile } from "fs/promises";
import { ParseResult, parseAsync } from "@babel/core";
import { appConfigDir, frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { Builder } from "./base-builder.js";
import { Jiti } from "jiti/lib/types.js";
import { getAppConfig } from "../helpers/config.js";

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

// RSCs that hold server actions defined in module scope
type ServerActionEntry = {
  moduleId: string;
  path: string;
};

let clientMarker = '"use client";';
let serverMarker = '"use server";';

export class EntriesBuilder extends Builder {
  readonly name = "entries";

  #context?: BuildContext;

  #clientComponentModuleMap = new Map<string, ClientComponentModule>();
  #serverActionModuleMap = new Map<string, ServerActionModule>();
  #serverActionEntryMap = new Map<string, ServerActionEntry>();

  get clientComponentModuleMap() {
    return this.#clientComponentModuleMap;
  }

  get serverActionModuleMap() {
    return this.#serverActionModuleMap;
  }

  get serverActionEntryMap() {
    return this.#serverActionEntryMap;
  }

  async setup() {
    let frameworkComponentsUrl = new URL("./components/", frameworkSrcDir);
    let frameworkComponentsPath = fileURLToPath(frameworkComponentsUrl);

    let appConfig = await getAppConfig();
    let externalPackages = appConfig.externalPackages ?? [];

    let builder = this;
    this.#context = await context({
      entryPoints: [
        "./src/**/*.ts",
        "./src/**/*.tsx",
        `${frameworkComponentsPath}/**/*.tsx`,
      ],
      bundle: true,
      platform: "node",
      conditions: ["module"],
      logLevel: "error",
      entryNames: "entries/[name]-[hash]",
      metafile: true,
      write: false,
      outdir: "./.twofold/temp/",
      outbase: "src",
      external: ["react", "react-dom", ...externalPackages],
      plugins: [
        {
          name: "find-entry-points-plugin",
          setup(build) {
            build.onLoad({ filter: /\.(tsx|ts|jsx|js)$/ }, async ({ path }) => {
              let contents = await readFile(path, "utf-8");

              if (contents.startsWith(clientMarker)) {
                let module = await pathToClientComponentModule(path);
                builder.#clientComponentModuleMap.set(path, module);
              } else if (contents.startsWith(serverMarker)) {
                let module = await pathToServerActionModule(path);
                builder.#serverActionModuleMap.set(path, module);
              } else if (contents.includes(serverMarker)) {
                let module = await pathToServerActionEntry(path);
                builder.#serverActionEntryMap.set(path, module);
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

    this.clearError();

    try {
      await this.#context.rebuild();
    } catch (error) {
      console.error(error);
      this.reportError(error);
    }
  }

  async stop() {
    await this.#context?.dispose();
  }

  serialize() {
    return {
      clientComponentModuleMap: Object.fromEntries(
        this.#clientComponentModuleMap.entries()
      ),
      serverActionModuleMap: Object.fromEntries(
        this.#serverActionModuleMap.entries()
      ),
      serverActionEntryMap: Object.fromEntries(
        this.#serverActionEntryMap.entries()
      ),
    };
  }

  load(data: any) {
    this.#clientComponentModuleMap = new Map(
      Object.entries(data.clientComponentModuleMap)
    );
    this.#serverActionModuleMap = new Map(
      Object.entries(data.serverActionModuleMap)
    );
    this.#serverActionEntryMap = new Map(
      Object.entries(data.serverActionEntryMap)
    );
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

async function pathToServerActionEntry(path: string) {
  let moduleId = getModuleId(path);

  return {
    moduleId,
    path,
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
              : specifier.exported.value
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
      []
    ) ?? [];

  return exports;
}
