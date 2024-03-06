import { build } from "esbuild";
import { BuildMetafile } from "../build";
import { EntriesBuilder } from "./entries-builder";
import { getCompiledEntrypoint } from "./helpers/compiled-entrypoint.js";

type CompiledAction = {
  id: string;
  path: string;
  export: string;
};

export class ServerActionsModuleBuilder {
  #error?: Error;
  #entriesBuilder: EntriesBuilder;
  #serverActionMap = new Map<string, CompiledAction>();

  constructor({ entriesBuilder }: { entriesBuilder: EntriesBuilder }) {
    this.#entriesBuilder = entriesBuilder;
  }

  get actionEntryPoints() {
    return Array.from(this.#entriesBuilder.serverActionModulePathMap.keys());
  }

  get serverActionMap() {
    return this.#serverActionMap;
  }

  async build() {
    this.#error = undefined;

    let builder = this;

    this.#serverActionMap = new Map();

    try {
      await build({
        bundle: true,
        format: "esm",
        jsx: "automatic",
        logLevel: "error",
        entryPoints: [...this.actionEntryPoints],
        entryNames: "entries/[name]-[hash]",
        outdir: "./.twofold/server-action-modules/",
        outbase: "src",
        splitting: true,
        chunkNames: "chunks/[name]-[hash]",
        metafile: true,
        plugins: [
          {
            name: "server-action-map-plugin",
            setup(build) {
              build.initialOptions.metafile = true;

              build.onEnd((result) => {
                let metafile = result.metafile;

                if (!metafile) {
                  throw new Error("No metafile");
                }

                let serverActionModules =
                  builder.#entriesBuilder.serverActionModulePathMap.values();

                for (let module of serverActionModules) {
                  let outputFile = getCompiledEntrypoint(module.path, metafile);
                  for (let action of module.exports) {
                    let id = `${module.moduleId}#${action}`;
                    builder.serverActionMap.set(id, {
                      id,
                      path: outputFile,
                      export: action,
                    });
                  }
                }
              });
            },
          },
          // need to "hole" client components here as well
        ],
      });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        this.#error = error;
      } else {
        this.#error = new Error("Unknown error");
      }
    }
  }

  get error() {
    return this.#error;
  }
}
