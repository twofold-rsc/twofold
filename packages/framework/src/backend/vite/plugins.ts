import react from "@vitejs/plugin-react";
import rsc, { getPluginApi } from "@vitejs/plugin-rsc";
import { type InlineConfig, mergeConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { RscPluginManager } from "@vitejs/plugin-rsc/plugin";
import { exactRegex, prefixRegex } from "@rolldown/pluginutils";
import path from "node:path";

function createVirtualPlugin(
  name: string,
  impl: {
    resolveId?: Plugin["resolveId"];
    load: Exclude<Plugin["load"], undefined>;
  },
): Plugin {
  const virtualId = `virtual:twofold/${name}`;
  const resolvedId = "\0" + virtualId;
  return {
    name: `twofold:${name}`,
    resolveId: {
      filter: { id: exactRegex(virtualId) },
      async handler(source, importer, options) {
        if (source === virtualId) {
          const resolveIdFunc =
            typeof impl.resolveId === "function"
              ? impl.resolveId
              : impl.resolveId?.handler;
          if (resolveIdFunc) {
            const resolvedIdOverride = await resolveIdFunc.bind(this)(
              source,
              importer,
              options,
            );
            if (resolvedIdOverride) {
              return resolvedIdOverride;
            }
          }
          return resolvedId;
        }
      },
    },
    load: {
      filter: { id: exactRegex(resolvedId) },
      async handler(id) {
        if (id === resolvedId) {
          const loadFunc =
            typeof impl.load === "function" ? impl.load : impl.load.handler;
          return await loadFunc.bind(this)(id);
        }
      },
    },
  };
}

function twofoldServerApplicationRouter(): Plugin {
  return createVirtualPlugin("server-application-router", {
    load() {
      return `
import { ApplicationRuntime } from '@twofold/framework/internal/router';
export default new ApplicationRuntime(
  import.meta.glob(
    "./**/{*.error.tsx,*.page.tsx,layout.tsx,*.api.ts,*.api.tsx}",
    { base: "./app/pages" }
  ));
`;
    },
  });
}

function twofoldGlobalMiddleware(baseDir: string): Plugin {
  return createVirtualPlugin("server-global-middleware", {
    async resolveId(_source, _importer, options) {
      const middlewarePath = `${baseDir}/app/middleware.ts`;
      const resolved = await this.resolve(middlewarePath, undefined, options);
      return resolved;
    },
    load() {
      return `
export default undefined
`;
    },
  });
}

function parseIdQuery(id: string): {
  filename: string;
  query: {
    [k: string]: string;
  };
} {
  if (!id.includes("?")) return { filename: id, query: {} };
  const [filename, rawQuery] = id.split(`?`, 2) as [string, string];
  const query = Object.fromEntries(new URLSearchParams(rawQuery));
  return { filename, query };
}

function normalizeRelativePathToRoute(appPath: string) {
  appPath = appPath.replaceAll("\\", "/");
  if (
    appPath.startsWith(".") ||
    !appPath.startsWith("app/pages") ||
    path.isAbsolute(appPath)
  ) {
    return;
  }
  appPath = appPath.slice("app/pages".length);
  appPath = appPath.replaceAll(/^(.+)\.tsx?$/g, "$1");
  if (appPath.endsWith("/layout")) {
    appPath = appPath.slice(0, -"/layout".length);
  }
  const knownSuffixes = [".page", ".api", ".error"];
  for (const suffix of knownSuffixes) {
    if (appPath.endsWith(suffix)) {
      appPath = appPath.slice(0, -suffix.length);
    }
  }
  if (appPath.endsWith("/index")) {
    appPath = appPath.slice(0, -"/index".length);
  }
  if (appPath === "") {
    appPath = "/";
  }
  return appPath;
}

function twofoldServerReferencesMetaMapDev(baseDir: string): Plugin {
  let manager: RscPluginManager;
  return {
    name: "twofold:server-references-meta-map-dev",
    apply: "serve",
    async configureServer(server) {
      console.log("twofoldServerActionMetadata: configureServer");
      manager = getPluginApi(server.config)!.manager;
    },
    load: {
      filter: {
        id: prefixRegex("\0virtual:twofold/server-references-meta-map-lookup?"),
      },
      handler(id, _options) {
        if (
          id.startsWith("\0virtual:twofold/server-references-meta-map-lookup?")
        ) {
          const parsed = parseIdQuery(id).query as any;
          const meta = Object.values(manager.serverReferenceMetaMap).find(
            (meta) => meta.referenceKey === parsed.id,
          );
          if (!meta) {
            throw new Error(
              `Missing reference to server action ${parsed.id} in serverReferenceMetaMap`,
            );
          }
          const appPath = normalizeRelativePathToRoute(
            path.relative(baseDir, meta.importId),
          );
          if (appPath === undefined) {
            throw new Error(
              `Server action in file ${meta.importId} is not located underneath '/app/pages', which is required for authentication on server actions to be enforced. Move your server action to a file underneath '/app/pages'.`,
            );
          }
          return `export default ${JSON.stringify(appPath)}`;
        }
      },
    },
  };
}

function twofoldServerReferencesMetaMapBuild(baseDir: string): Plugin {
  const virtualId = "virtual:twofold/server-references-meta-map";
  const resolvedId = "\0" + virtualId;
  let manager: RscPluginManager;
  return {
    name: "twofold:server-references-meta-map-build",
    async configResolved(config) {
      manager = getPluginApi(config)!.manager;
    },
    resolveId: {
      filter: { id: exactRegex(virtualId) },
      handler(source) {
        if (source === virtualId) {
          return resolvedId;
        }
      },
    },
    load: {
      filter: { id: exactRegex(resolvedId) },
      handler(id) {
        if (id === resolvedId) {
          if (this.environment.mode === "dev") {
            return `export {}`;
          }
          let referencesToAppPaths: Record<string, string> = {};
          for (const key of Object.getOwnPropertyNames(
            manager.serverReferenceMetaMap,
          )) {
            const value = manager.serverReferenceMetaMap[key];
            if (value?.referenceKey === undefined) {
              continue;
            }
            let appPath = normalizeRelativePathToRoute(
              path.relative(baseDir, key),
            );
            if (appPath === undefined) {
              continue;
            }
            referencesToAppPaths[value.referenceKey] = appPath;
          }
          return `
export default ${JSON.stringify(referencesToAppPaths)}
`;
        }
      },
    },
  };
}

export function withTwofold(
  config: InlineConfig,
  isBuild: boolean,
): InlineConfig {
  const baseDir = process.cwd();
  return mergeConfig(
    {
      configFile: false,
      resolve: {
        noExternal: isBuild ? true : undefined,
        alias: [
          {
            find: "@",
            replacement: process.cwd(),
          },
        ],
      },
      assetsInclude: ["**/*.html"],
      environments: {
        client: {
          build: {
            outDir: ".twofold/client",
            rolldownOptions: {
              input: {
                index:
                  "@twofold/framework/internal/entrypoint/entry.browser.tsx",
              },
            },
          },
        },
        ssr: {
          build: {
            outDir: ".twofold/ssr",
            rolldownOptions: {
              input: {
                index: "@twofold/framework/internal/entrypoint/entry.ssr.tsx",
              },
            },
          },
        },
        rsc: {
          build: {
            outDir: ".twofold/server",
            rolldownOptions: {
              input: {
                index: "@twofold/framework/internal/entrypoint/entry.server.ts",
              },
            },
          },
        },
      },
      plugins: [
        tailwindcss(),
        rsc({}),
        react(),
        twofoldServerApplicationRouter(),
        twofoldGlobalMiddleware(baseDir),
        twofoldServerReferencesMetaMapDev(baseDir),
        twofoldServerReferencesMetaMapBuild(baseDir),
      ],
    },
    config ?? {},
  );
}
