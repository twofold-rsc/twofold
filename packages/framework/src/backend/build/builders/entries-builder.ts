import { glob } from "fs/promises";
import { cwdUrl, frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { getModuleId } from "../helpers/module.js";
import { check as checkClientModule } from "@twofold/client-component-transforms";
import { check as checkServerModule } from "@twofold/server-function-transforms";
import { pathToLanguage } from "../helpers/languages.js";
import { findExternals } from "../externals/find.js";
import { excludePackages } from "../externals/predefined-externals.js";
import { scan } from "rolldown/experimental";

type Entry = {
  moduleId: string;
  path: string;
};

export class EntriesBuilder extends Builder {
  readonly name = "entries";

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

  async setup() {}

  async build() {
    this.clearError();

    this.#clientComponentEntryMap = new Map();
    this.#serverActionEntryMap = new Map();

    let frameworkComponentsUrl = new URL(
      "./client/components/",
      frameworkSrcDir,
    );
    let frameworkComponentsPath = fileURLToPath(frameworkComponentsUrl);

    let appConfig = await this.#build.getAppConfig();
    let userDefinedExternalPackages = appConfig.externalPackages ?? [];

    let discoveredExternals = await findExternals(
      cwdUrl,
      userDefinedExternalPackages,
    );
    this.#discoveredExternals = discoveredExternals;

    let appFiles = await Array.fromAsync(
      glob("app/pages/**/*.{ts,tsx,js,jsx}"),
    );
    let frameworkFiles = await Array.fromAsync(
      glob(`${frameworkComponentsPath}/**/*.tsx`),
    );

    let builder = this;

    try {
      await scan({
        cwd: fileURLToPath(cwdUrl),
        tsconfig: true,
        input: [...appFiles, ...frameworkFiles],
        platform: "node",
        external: [
          ...excludePackages,
          ...userDefinedExternalPackages,
          ...discoveredExternals,
        ],
        plugins: [
          {
            name: "empties",
            load: {
              filter: {
                id: [
                  /\.(css)$/i,
                  /\.(jpe?g|png|gif|webp|avif|svg)$/i,
                  /\.(woff2)$/i,
                ],
              },
              handler() {
                return { code: "" };
              },
            },
          },
          {
            name: "find-server-entries",
            transform: {
              filter: {
                code: /["']use server["']/,
                moduleType: ["ts", "tsx", "js", "jsx"],
              },
              async handler(code, id) {
                let moduleId = getModuleId(id);
                let language = pathToLanguage(id);
                let isServerModule = await checkServerModule({
                  input: {
                    code,
                    language,
                  },
                  moduleId,
                });

                if (isServerModule) {
                  let module = await pathToEntry(id);
                  builder.#serverActionEntryMap.set(id, module);
                }
              },
            },
          },
          {
            name: "find-client-entries",
            transform: {
              filter: {
                code: /["']use client["']/,
                moduleType: ["ts", "tsx", "js", "jsx"],
              },
              async handler(code, id) {
                let moduleId = getModuleId(id);
                let language = pathToLanguage(id);
                let isClientModule = await checkClientModule({
                  input: {
                    code,
                    language,
                  },
                  moduleId,
                });

                if (isClientModule) {
                  let module = await pathToEntry(id);
                  builder.#clientComponentEntryMap.set(id, module);
                }
              },
            },
          },
        ],
      });
    } catch (error: unknown) {
      console.error(error);
      this.reportError(error);
    }
  }

  async stop() {}

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
