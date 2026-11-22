import { transform as transformClientComponent } from "@twofold/client-component-transforms";
import {
  check as checkServerModule,
  transform as transformServerFunction,
} from "@twofold/server-function-transforms";
import { glob } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import type { Plugin } from "rolldown";
import { scan } from "rolldown/experimental";
import { fileURLToPath, pathToFileURL } from "url";
import type { Config } from "../../../types/importable.js";
import { frameworkSrcDir } from "../../files.js";
import { findExternals } from "../externals/find.js";
import {
  bundlePackages as predefinedBundlePackages,
  excludePackages,
} from "../externals/predefined-externals.js";
import { shouldIgnoreUseClient, shouldIgnoreUseServer } from "../helpers/excluded.js";
import { fileExists } from "../helpers/file.js";
import { pathToLanguage } from "../helpers/languages.js";
import { getModuleId } from "../helpers/module.js";
import { Builder, type SerializedOutput } from "./builder.js";

export type EntriesQueueBuilderInput = {
  readonly sourceRoot: URL;
  readonly config: Config;
};

type Entry = {
  readonly moduleId: string;
  readonly path: string;
};

export class EntriesQueueOutput {
  readonly sourceRoot: URL;
  readonly externalPackages: readonly string[];
  readonly clientComponentEntryMap: ReadonlyMap<string, Entry>;
  readonly serverActionEntryMap: ReadonlyMap<string, Entry>;

  constructor({
    sourceRoot,
    externalPackages,
    clientComponentEntryMap,
    serverActionEntryMap,
  }: {
    sourceRoot: URL;
    externalPackages: readonly string[];
    clientComponentEntryMap: ReadonlyMap<string, Entry>;
    serverActionEntryMap: ReadonlyMap<string, Entry>;
  }) {
    this.sourceRoot = normalizeSourceRoot(sourceRoot);
    this.externalPackages = externalPackages;
    this.clientComponentEntryMap = clientComponentEntryMap;
    this.serverActionEntryMap = serverActionEntryMap;
  }

  serialize() {
    return {
      sourceRoot: this.sourceRoot.href,
      externalPackages: this.externalPackages,
      clientComponentEntryMap: Object.fromEntries(this.clientComponentEntryMap),
      serverActionEntryMap: Object.fromEntries(this.serverActionEntryMap),
    };
  }

  warm() {}
}

type Environment = "rsc" | "client";

class ScanQueue {
  #scheduled = new Set<string>();
  #pending: string[] = [];

  add(id: string) {
    if (!this.#scheduled.has(id)) {
      this.#scheduled.add(id);
      this.#pending.push(id);
    }
  }

  takeBatch() {
    let batch = this.#pending;
    this.#pending = [];
    return batch.sort();
  }

  get hasPending() {
    return this.#pending.length > 0;
  }
}

export class EntriesQueueBuilder extends Builder<EntriesQueueBuilderInput, EntriesQueueOutput> {
  async build({ sourceRoot, config }: EntriesQueueBuilderInput) {
    sourceRoot = normalizeSourceRoot(sourceRoot);
    let cwd = fileURLToPath(sourceRoot);
    let [externalPackages, rscRoots] = await Promise.all([
      getExternalPackages(sourceRoot, config),
      getRscEntryRoots(sourceRoot),
    ]);
    let clientAliases = getClientResolveAliases(sourceRoot);
    let clientComponents = new Map<string, Entry>();
    let serverActions = new Map<string, Entry>();
    let queues = { rsc: new ScanQueue(), client: new ScanQueue() };

    for (let file of rscRoots) {
      queues.rsc.add(file);
    }
    queues.client.add(frameworkPath("apps/client/browser/initialize-browser.tsx"));
    queues.client.add(frameworkPath("apps/client/ssr/ssr-app.tsx"));

    while (queues.rsc.hasPending || queues.client.hasPending) {
      for (let environment of ["rsc", "client"] as const) {
        let inputs = queues[environment].takeBatch();
        if (!inputs.length) continue;
        await scanBatch(environment, inputs);
      }
    }

    return new EntriesQueueOutput({
      sourceRoot,
      externalPackages,
      clientComponentEntryMap: sortedEntries(clientComponents),
      serverActionEntryMap: sortedEntries(serverActions),
    });

    async function scanBatch(environment: Environment, input: string[]) {
      await scan(
        {
          cwd,
          input,
          tsconfig: true,
          platform: environment === "rsc" ? "node" : "browser",
          resolve:
            environment === "rsc"
              ? { conditionNames: ["react-server", "module"] }
              : { alias: clientAliases },
          external: (id) =>
            environment === "rsc"
              ? externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`))
              : id === "twofold:error-html",
          plugins: [
            {
              name: "entries-queue-assets",
              load: {
                filter: { id: /\.(css|jpe?g|png|gif|webp|avif|svg|woff2)$/i },
                handler() {
                  return { code: 'export default "";', moduleType: "js" };
                },
              },
            },
            environment === "rsc"
              ? rscDiscoveryPlugin({
                  onClientComponent(entry) {
                    clientComponents.set(entry.path, entry);
                    queues.client.add(entry.path);
                  },
                  onServerAction(entry) {
                    serverActions.set(entry.path, entry);
                  },
                })
              : clientDiscoveryPlugin((entry) => {
                  serverActions.set(entry.path, entry);
                  queues.rsc.add(entry.path);
                }),
          ],
        },
        { format: "esm" },
      );
    }
  }

  load(data: SerializedOutput<EntriesQueueOutput>) {
    return new EntriesQueueOutput({
      sourceRoot: new URL(data.sourceRoot),
      clientComponentEntryMap: new Map(Object.entries(data.clientComponentEntryMap)),
      serverActionEntryMap: new Map(Object.entries(data.serverActionEntryMap)),
      externalPackages: data.externalPackages,
    });
  }
}

function rscDiscoveryPlugin({
  onClientComponent,
  onServerAction,
}: {
  onClientComponent: (entry: Entry) => void;
  onServerAction: (entry: Entry) => void;
}): Plugin {
  return {
    name: "entries-queue-rsc",
    transform: {
      filter: {
        id: /\.(ts|tsx|js|jsx|mjs)$/,
        code: /use (client|server)/,
      },
      async handler(code, id) {
        let entry = { path: id, moduleId: getModuleId(id) };
        let options = {
          input: { code, language: pathToLanguage(id) },
          moduleId: entry.moduleId,
        };
        if (code.includes("use client") && !shouldIgnoreUseClient(id)) {
          let result = await transformClientComponent({
            ...options,
            rscClientPath: "react-server-dom-webpack/server.edge",
          });
          if (result.clientExports.length > 0) {
            onClientComponent(entry);
          }
          // Match RSCBuilder's client transform taking precedence.
          return { code: result.code, moduleType: "js" };
        }
        if (
          code.includes("use server") &&
          !shouldIgnoreUseServer(id) &&
          (await checkServerModule(options))
        ) {
          onServerAction(entry);
        }
      },
    },
  };
}

function clientDiscoveryPlugin(onServerAction: (entry: Entry) => void): Plugin {
  return {
    name: "entries-queue-client",
    transform: {
      filter: {
        id: /\.(ts|tsx|js|jsx|mjs)$/,
        code: /use server/,
      },
      async handler(code, id) {
        if (shouldIgnoreUseServer(id)) return;

        let entry = { path: id, moduleId: getModuleId(id) };
        let result = await transformServerFunction({
          input: { code, language: pathToLanguage(id) },
          moduleId: entry.moduleId,
          client: { callServerModule: getCallServerImport(id) },
        });
        if (result.serverFunctions.length > 0) {
          onServerAction(entry);
          return { code: result.code, moduleType: "js" };
        }
      },
    },
  };
}

function sortedEntries(entries: ReadonlyMap<string, Entry>) {
  return new Map([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function normalizeSourceRoot(sourceRoot: URL) {
  let root = fileURLToPath(sourceRoot);
  return pathToFileURL(root.endsWith(path.sep) ? root : `${root}${path.sep}`);
}

async function getExternalPackages(root: URL, config: Config) {
  let configuredExternal = config.externalPackages ?? [];
  let configuredBundle = config.bundlePackages ?? [];
  let configuredExternalSet = new Set(configuredExternal);

  for (let name of configuredBundle) {
    if (configuredExternalSet.has(name)) {
      throw new Error(`Package "${name}" cannot be both external and bundled`);
    }
    if (excludePackages.includes(name)) {
      throw new Error(`Package "${name}" cannot be bundled because it is a predefined external`);
    }
  }

  for (let name of configuredExternal) {
    if (predefinedBundlePackages.includes(name)) {
      throw new Error(`Package "${name}" cannot be external because it is a predefined bundle`);
    }
  }

  let discovered = await findExternals(root, [...configuredExternal, ...configuredBundle]);
  return [...new Set([...excludePackages, ...configuredExternal, ...discovered])];
}

function frameworkPath(file: string) {
  return fileURLToPath(new URL(`./client/${file}`, frameworkSrcDir));
}

async function getRscEntryRoots(sourceRoot: URL) {
  let cwd = fileURLToPath(sourceRoot);
  let routeFiles = await Array.fromAsync(
    glob(
      [
        "./app/pages/**/*.error.tsx",
        "./app/pages/**/*.page.tsx",
        "./app/pages/**/layout.tsx",
        "./app/pages/**/*.api.ts",
        "./app/pages/**/*.api.tsx",
      ],
      { cwd },
    ),
  );
  let middleware = path.join(cwd, "app/middleware.ts");
  let notFound = path.join(cwd, "app/pages/not-found.error.tsx");
  let unauthorized = path.join(cwd, "app/pages/unauthorized.error.tsx");

  return [
    ...routeFiles.map((file) => path.resolve(cwd, file)),
    ...((await fileExists(middleware)) ? [middleware] : []),
    (await fileExists(notFound))
      ? notFound
      : frameworkPath("components/error-templates/not-found.tsx"),
    (await fileExists(unauthorized))
      ? unauthorized
      : frameworkPath("components/error-templates/unauthorized.tsx"),
    frameworkPath("pages/unauthorized.tsx"),
    frameworkPath("pages/not-found.tsx"),
    frameworkPath("components/outer-root-wrapper.tsx"),
    frameworkPath("components/route-stack/placeholder.tsx"),
    frameworkPath("components/boundaries/catch-boundary.tsx"),
  ];
}

function getClientResolveAliases(sourceRoot: URL) {
  let require = createRequire(new URL("./package.json", sourceRoot));
  let directory = path.dirname(require.resolve("react-server-dom-webpack/package.json"));
  let browser = path.join(directory, "client.browser.js");
  return {
    "react-server-dom-webpack/client": browser,
    "react-server-dom-webpack/client.edge": path.join(directory, "client.edge.js"),
    "react-server-dom-webpack/client.browser": browser,
  };
}

function getCallServerImport(importer: string) {
  return path
    .relative(path.dirname(importer), frameworkPath("apps/client/actions/call-server.ts"))
    .split(path.sep)
    .join("/")
    .replace(/\.ts$/, "");
}
