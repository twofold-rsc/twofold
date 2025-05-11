import { readFirstNBytes } from "../helpers/file.js";
import { externalPackages } from "../packages.js";
import { BuildContext, context, transform } from "esbuild";
import { readFile } from "fs/promises";
import { ParseResult, parseAsync } from "@babel/core";
import { frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { getModuleId } from "../helpers/module.js";
import { externalsPlugin } from "../plugins/externals-plugin.js";

type ClientComponentModule = {
  moduleId: string;
  path: string;
  exports: string[];
};

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
  #serverActionEntryMap = new Map<string, ServerActionEntry>();
  #discoveredExternals = new Set<string>();

  constructor({ build }: { build: Build }) {
    super();

    this.#build = build;
  }

  get clientComponentModuleMap() {
    return this.#clientComponentModuleMap;
  }

  get serverActionEntryMap() {
    return this.#serverActionEntryMap;
  }

  get discoveredExternals() {
    return this.#discoveredExternals;
  }

  async setup() {
    let frameworkComponentsUrl = new URL(
      "./client/components/",
      frameworkSrcDir,
    );
    let frameworkComponentsPath = fileURLToPath(frameworkComponentsUrl);

    let appConfig = await this.#build.getAppConfig();
    let userDefinedExternalPackages = appConfig.externalPackages;

    let builder = this;
    this.#context = await context({
      entryPoints: [
        "./app/pages/**/*.ts",
        "./app/pages/**/*.tsx",
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
      outbase: "app",
      loader: {
        ".jpg": "empty",
      },
      external: [...externalPackages, ...userDefinedExternalPackages],
      plugins: [
        externalsPlugin({
          userDefinedExternalPackages: userDefinedExternalPackages,
          onEnd: (discoveredExternals) => {
            builder.#discoveredExternals = discoveredExternals;
          },
        }),
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

              if (clientMarkers.some(contentsStartsWithMarker)) {
                let module = await pathToClientComponentModule(path);
                builder.#clientComponentModuleMap.set(path, module);
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
    this.#serverActionEntryMap = new Map();
    this.#discoveredExternals = new Set();

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
      serverActionEntryMap: Object.fromEntries(
        this.#serverActionEntryMap.entries(),
      ),
      discoveredExternals: Array.from(this.#discoveredExternals),
    };
  }

  load(data: any) {
    this.#clientComponentModuleMap = new Map(
      Object.entries(data.clientComponentModuleMap),
    );
    this.#serverActionEntryMap = new Map(
      Object.entries(data.serverActionEntryMap),
    );
    this.#discoveredExternals = new Set(data.discoveredExternals);
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

async function pathToServerActionEntry(path: string) {
  let moduleId = getModuleId(path);

  return {
    moduleId,
    path,
  };
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
