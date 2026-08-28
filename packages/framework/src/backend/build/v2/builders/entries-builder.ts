import { glob } from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { check as checkClientModule } from "@twofold/client-component-transforms";
import { check as checkServerModule } from "@twofold/server-function-transforms";
import { scan } from "rolldown/experimental";
import type { Config } from "../../../../types/importable.js";
import { frameworkSrcDir } from "../../../files.js";
import { findExternals } from "../../externals/find.js";
import {
  bundlePackages as predefinedBundlePackages,
  excludePackages,
} from "../../externals/predefined-externals.js";
import { pathToLanguage } from "../../helpers/languages.js";
import { getModuleId } from "../../helpers/module.js";
import { Builder } from "./builder.js";

let excludedPackageSet = new Set(excludePackages);
let bundledPackageSet = new Set(predefinedBundlePackages);

export type EntriesBuilderInput = {
  readonly sourceRoot: URL;
  readonly config: Config;
};

export class EntriesBuilder extends Builder<
  EntriesBuilderInput,
  EntriesOutput
> {
  async build({ sourceRoot, config }: EntriesBuilderInput) {
    let normalizedSourceRoot = normalizeSourceRoot(sourceRoot);
    let clientComponentEntryMap = new Map<string, Entry>();
    let serverActionEntryMap = new Map<string, Entry>();

    let configuredExternalPackages = config.externalPackages ?? [];
    let configuredBundlePackages = config.bundlePackages ?? [];
    let configuredExternalPackageSet = new Set(configuredExternalPackages);

    for (let packageName of configuredBundlePackages) {
      if (configuredExternalPackageSet.has(packageName)) {
        throw new Error(
          `Package "${packageName}" cannot be both external and bundled`,
        );
      }

      if (excludedPackageSet.has(packageName)) {
        throw new Error(
          `Package "${packageName}" cannot be bundled because it is a predefined external`,
        );
      }
    }

    for (let packageName of configuredExternalPackages) {
      if (bundledPackageSet.has(packageName)) {
        throw new Error(
          `Package "${packageName}" cannot be external because it is a predefined bundle`,
        );
      }
    }

    let discoveredExternalPackages = await findExternals(normalizedSourceRoot, [
      ...configuredExternalPackages,
      ...configuredBundlePackages,
    ]);

    let externalPackages = Array.from(
      new Set([
        ...excludePackages,
        ...configuredExternalPackages,
        ...discoveredExternalPackages,
      ]),
    );

    let rootPath = fileURLToPath(normalizedSourceRoot);
    let frameworkComponentsUrl = new URL(
      "./client/components/",
      frameworkSrcDir,
    );
    let frameworkComponentsPath = fileURLToPath(frameworkComponentsUrl);

    let appFiles = await Array.fromAsync(
      glob("app/pages/**/*.{ts,tsx,js,jsx}", { cwd: rootPath }),
    );
    let frameworkFiles = await Array.fromAsync(
      glob("**/*.tsx", { cwd: frameworkComponentsPath }),
    );
    let frameworkInputs = frameworkFiles.map((file) =>
      path.resolve(frameworkComponentsPath, file),
    );

    await scan({
      cwd: rootPath,
      tsconfig: true,
      input: [...appFiles, ...frameworkInputs],
      platform: "node",
      external: externalPackages,
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
              return {
                code: "",
                moduleType: "js",
              };
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
                serverActionEntryMap.set(id, pathToEntry(id));
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
                clientComponentEntryMap.set(id, pathToEntry(id));
              }
            },
          },
        },
      ],
    });

    return new EntriesOutput({
      sourceRoot: normalizedSourceRoot,
      clientComponentEntryMap,
      serverActionEntryMap,
      externalPackages,
    });
  }

  load(data: ReturnType<EntriesOutput["serialize"]>) {
    return new EntriesOutput({
      sourceRoot: new URL(data.sourceRoot),
      clientComponentEntryMap: new Map(
        Object.entries(data.clientComponentEntryMap),
      ),
      serverActionEntryMap: new Map(Object.entries(data.serverActionEntryMap)),
      externalPackages: data.externalPackages,
    });
  }
}

export class EntriesOutput {
  readonly sourceRoot: URL;
  readonly clientComponentEntryMap: ReadonlyMap<string, Entry>;
  readonly serverActionEntryMap: ReadonlyMap<string, Entry>;
  readonly externalPackages: readonly string[];

  constructor({
    sourceRoot,
    clientComponentEntryMap,
    serverActionEntryMap,
    externalPackages,
  }: {
    sourceRoot: URL;
    clientComponentEntryMap: ReadonlyMap<string, Entry>;
    serverActionEntryMap: ReadonlyMap<string, Entry>;
    externalPackages: readonly string[];
  }) {
    this.sourceRoot = normalizeSourceRoot(sourceRoot);
    this.clientComponentEntryMap = clientComponentEntryMap;
    this.serverActionEntryMap = serverActionEntryMap;
    this.externalPackages = externalPackages;
  }

  serialize() {
    return {
      sourceRoot: this.sourceRoot.href,
      clientComponentEntryMap: Object.fromEntries(
        this.clientComponentEntryMap.entries(),
      ),
      serverActionEntryMap: Object.fromEntries(
        this.serverActionEntryMap.entries(),
      ),
      externalPackages: this.externalPackages,
    };
  }

  warm() {}
}

type Entry = {
  readonly moduleId: string;
  readonly path: string;
};

function pathToEntry(path: string): Entry {
  return {
    moduleId: getModuleId(path),
    path,
  };
}

function normalizeSourceRoot(sourceRoot: URL) {
  let sourceRootPath = fileURLToPath(sourceRoot);
  return pathToFileURL(
    sourceRootPath.endsWith(path.sep)
      ? sourceRootPath
      : `${sourceRootPath}${path.sep}`,
  );
}
