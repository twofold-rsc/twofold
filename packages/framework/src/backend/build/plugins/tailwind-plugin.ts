import { Plugin } from "esbuild";
import { readFile } from "fs/promises";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

export function tailwindPlugin({ base }: { base: string }) {
  let plugin: Plugin = {
    name: "tailwind",
    async setup(build) {
      build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
        let css = await readFile(path, "utf8");

        let compiler = await compile(css, {
          base,
          onDependency(path: string) {
            // track path, if it changes we need to recompile
          },
        });

        let candidates: string[] = [];
        if (compiler.features > 0) {
          let sources = [...compiler.globs];
          if (compiler.root === null) {
            sources.push({ base, pattern: "**/*" });
          }
          let scanner = new Scanner({
            sources,
          });

          // instead of doing a full scan, we can only scan the files that changed
          // in this build (see scanFiles)
          candidates = scanner.scan();
        }

        let result = compiler.build(candidates);

        // optimize with lightening css

        return {
          contents: result,
          loader: "css",
        };
      });
    },
  };

  return plugin;
}
