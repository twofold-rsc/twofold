import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { InlineConfig, mergeConfig, Plugin, ResolvedConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

function twofold(baseDir: string): Plugin {
  return {
    name: "twofold",
    async resolveId(source) {
      if (source === "virtual:twofold/server-application-router") {
        return "\0" + source;
      }
    },
    load(id) {
      if (id === "\0virtual:twofold/server-application-router") {
        return `
import { ApplicationRuntime } from '@twofold/framework/internal/router';
export default new ApplicationRuntime(
  import.meta.glob(
    "./**/{*.error.tsx,*.page.tsx,layout.tsx,*.api.ts,*.api.tsx}",
    { base: "./app/pages" }
  ));
`;
      }
    },
  };
}

export function withTwofold(
  config?: InlineConfig | ResolvedConfig | undefined,
) {
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
      plugins: [tailwindcss(), rsc({}), react(), twofold(process.cwd())],
    },
    config ?? {},
  );
}
