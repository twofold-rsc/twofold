import { BuildContext, context } from "esbuild";
import { readFile } from "fs/promises";
import { cwdUrl, frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { getModuleId } from "../helpers/module.js";
import { check as checkClientModule } from "@twofold/client-component-transforms";
import { check as checkServerModule } from "@twofold/server-function-transforms";
import { pathToLanguage } from "../helpers/languages.js";
import {
  shouldIgnoreUseClient,
  shouldIgnoreUseServer,
} from "../helpers/excluded.js";
import { scan } from "../externals/scan.js";
import { excludePackages } from "../externals/predefined-externals.js";

type Entry = {
  moduleId: string;
  path: string;
};

let clientMarkers = ['"use client"', "'use client'"];
let serverMarkers = ['"use server"', "'use server'"];

export class EntriesBuilder extends Builder {
  readonly name = "entries";

  #context?: BuildContext;
  #build: Build;

  #clientComponentEntryMap = new Map<string, Entry>();
  #serverActionEntryMap = new Map<string, Entry>();
  #discoveredExternals: string[] = [];

  constructor({ build }: { build: Build }) {
    super();

    this.#build = build;
  }

  get clientComponentEntryMap() {
    return this.#clientComponentEntryMap;
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
    let userDefinedExternalPackages = appConfig.externalPackages ?? [];

    const discoveredExternals = await scan(cwdUrl, userDefinedExternalPackages);
    this.#discoveredExternals = discoveredExternals;

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
        ".css": "empty",
        ".png": "empty",
        ".jpg": "empty",
        ".jpeg": "empty",
        ".gif": "empty",
        ".webp": "empty",
        ".avif": "empty",
        ".svg": "empty",
        ".woff2": "empty",
      },
      external: [
        ...excludePackages,
        ...userDefinedExternalPackages,
        ...discoveredExternals,
      ],
      plugins: [
        {
          name: "find-entry-points-plugin",
          setup(build) {
            build.onLoad(
              { filter: /\.(tsx|ts|jsx|js|mjs)$/ },
              async ({ path }) => {
                let contents = await readFile(path, "utf-8");
                let contentsHasMarker = (marker: string) =>
                  contents.includes(marker);

                if (
                  clientMarkers.some(contentsHasMarker) &&
                  !shouldIgnoreUseClient(path)
                ) {
                  let moduleId = getModuleId(path);
                  let language = pathToLanguage(path);
                  let isClientModule = await checkClientModule({
                    input: {
                      code: contents,
                      language,
                    },
                    moduleId,
                  });

                  if (isClientModule) {
                    let module = await pathToEntry(path);
                    builder.#clientComponentEntryMap.set(path, module);
                  }
                } else if (
                  serverMarkers.some(contentsHasMarker) &&
                  !shouldIgnoreUseServer(path)
                ) {
                  let moduleId = getModuleId(path);
                  let language = pathToLanguage(path);
                  let isServerModule = await checkServerModule({
                    input: {
                      code: contents,
                      language,
                    },
                    moduleId,
                  });
                  if (isServerModule) {
                    let module = await pathToEntry(path);
                    builder.#serverActionEntryMap.set(path, module);
                  }
                }

                return null;
              },
            );
          },
        },
      ],
    });
  }

  async build() {
    if (!this.#context) {
      throw new Error("setup must be called before build");
    }

    this.#clientComponentEntryMap = new Map();
    this.#serverActionEntryMap = new Map();

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
      clientComponentEntryMap: Object.fromEntries(
        this.#clientComponentEntryMap.entries(),
      ),
      serverActionEntryMap: Object.fromEntries(
        this.#serverActionEntryMap.entries(),
      ),
      discoveredExternals: this.#discoveredExternals,
    };
  }

  load(data: any) {
    this.#clientComponentEntryMap = new Map(
      Object.entries(data.clientComponentEntryMap),
    );
    this.#serverActionEntryMap = new Map(
      Object.entries(data.serverActionEntryMap),
    );
    this.#discoveredExternals = data.discoveredExternals;
  }

  warm() {}
}

async function pathToEntry(path: string) {
  let moduleId = getModuleId(path);

  return {
    moduleId,
    path,
  };
}
