import { readFirstNBytes } from "../helpers/file.js";
import { externalPackages } from "../externals.js";
import { BuildContext, context, transform } from "esbuild";
import { createHash } from "crypto";
import { basename, extname } from "path";
import { readFile } from "fs/promises";
import { ParseResult, parseAsync } from "@babel/core";
import { frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";

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

let clientMarkers = ['"use client"', "'use client'"];
let serverMarkers = ['"use server"', "'use server'"];

export class EntriesBuilder extends Builder {
  readonly name = "entries";

  #context?: BuildContext;
  #build: Build;

  #clientComponentModuleMap = new Map<string, ClientComponentModule>();
  #serverActionModuleMap = new Map<string, ServerActionModule>();
  #serverActionEntryMap = new Map<string, ServerActionEntry>();

  constructor({ build }: { build: Build }) {
    super();

    this.#build = build;
  }

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

    let appConfig = await this.#build.getAppConfig();
    let userDefinedExternalPackages = appConfig.externalPackages;

    let builder = this;
    this.#context = await context({
      entryPoints: [
        "./src/pages/**/*.page.tsx",
        "./src/pages/**/layout.tsx",
        "./src/pages/**/*.api.ts",
        "./src/pages/**/*.api.tsx",
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
      external: [
        "react",
        "react-dom",
        ...externalPackages,
        ...userDefinedExternalPackages,
      ],
      plugins: [
        {
          name: "find-entry-points-plugin",
          setup(build) {
            build.onLoad({ filter: /\.(tsx|ts|jsx|js)$/ }, async ({ path }) => {
              let contents = await readFile(path, "utf-8");
              // let contents = await readFirstNBytes(path, 12);

              let contentsStartsWithMarker = (marker: string) =>
                contents.startsWith(marker);
              let contentsHasMarker = (marker: string) =>
                contents.includes(marker);

              if (path.match(/unformatted/)) {
                console.log("unformatted", path);
                console.log(contents);
              }

              if (clientMarkers.some(contentsStartsWithMarker)) {
                let module = await pathToClientComponentModule(path);
                builder.#clientComponentModuleMap.set(path, module);
              } else if (serverMarkers.some(contentsStartsWithMarker)) {
                let module = await pathToServerActionModule(path);
                builder.#serverActionModuleMap.set(path, module);
              } else if (serverMarkers.some(contentsHasMarker)) {
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
        this.#clientComponentModuleMap.entries(),
      ),
      serverActionModuleMap: Object.fromEntries(
        this.#serverActionModuleMap.entries(),
      ),
      serverActionEntryMap: Object.fromEntries(
        this.#serverActionEntryMap.entries(),
      ),
    };
  }

  load(data: any) {
    this.#clientComponentModuleMap = new Map(
      Object.entries(data.clientComponentModuleMap),
    );
    this.#serverActionModuleMap = new Map(
      Object.entries(data.serverActionModuleMap),
    );
    this.#serverActionEntryMap = new Map(
      Object.entries(data.serverActionEntryMap),
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
