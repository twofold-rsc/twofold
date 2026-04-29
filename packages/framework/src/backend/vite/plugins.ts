import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { type InlineConfig, mergeConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { exactRegex } from "@rolldown/pluginutils";

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
export default function middleware(req: Request) { }
`;
    },
  });
}

export function withTwofold(config: InlineConfig): InlineConfig {
  const baseDir = process.cwd();
  return mergeConfig(
    {
      configFile: false,
      resolve: {
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
      ],
    },
    config ?? {},
  );
}
