import { readFirstNBytes } from "./helpers/file.js";
import { externalPackages } from "./externals.js";
import { BuildContext, context, transform } from "esbuild";
import { createHash } from "crypto";
import { basename, extname } from "path";
import { readFile } from "fs/promises";
import { parseAsync } from "@babel/core";

type ClientComponentModule = {
  moduleId: string;
  path: string;
  exports: string[];
};

type ServerActionModule = {
  moduleId: string;
  path: string;
  exports: string[];
};

let clientMarker = '"use client";';
let serverMarker = '"use server";';
let markers = [clientMarker, serverMarker];

export class EntriesBuilder {
  #context?: BuildContext;

  #clientComponentModules = new Set<ClientComponentModule>();
  #serverActionModules = new Set<ServerActionModule>();

  get clientComponentModules() {
    return this.#clientComponentModules;
  }

  get clientComponentModulePathMap() {
    let map = new Map<string, ClientComponentModule>();
    for (let module of this.#clientComponentModules) {
      map.set(module.path, module);
    }
    return map;
  }

  get serverActionModules() {
    return this.#serverActionModules;
  }

  get serverActionModulePathMap() {
    let map = new Map<string, ServerActionModule>();
    for (let module of this.#serverActionModules) {
      map.set(module.path, module);
    }
    return map;
  }

  async setup() {
    let builder = this;
    this.#context = await context({
      entryPoints: ["./src/**/*.ts", "./src/**/*.tsx"],
      bundle: true,
      format: "esm",
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
                let module = await pathToModule(path);

                if (contents === clientMarker) {
                  builder.#clientComponentModules.add(module);
                } else if (contents === serverMarker) {
                  builder.#serverActionModules.add(module);
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

    this.#clientComponentModules = new Set();
    await this.#context.rebuild();
  }
}

async function pathToModule(path: string) {
  let md5 = createHash("md5").update(path).digest("hex");
  let name = basename(path, extname(path));
  let moduleId = `${name}-${md5}`;

  let contents = await readFile(path, "utf-8");

  let { code } = await transform(contents, {
    loader: "tsx",
    jsx: "automatic",
    format: "esm",
  });

  let ast = await parseAsync(code);

  // find all exports
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

  return {
    moduleId,
    path,
    exports,
  };
}
