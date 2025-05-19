import { Plugin } from "esbuild";
import { readFile } from "fs/promises";
import { join } from "path";
import { getModuleId } from "../helpers/module.js";
import { transform as clientComponentTransform } from "@twofold/client-component-transforms";
import { pathToLanguage } from "../helpers/languages.js";
import { shouldIgnoreUseClient } from "../helpers/excluded.js";

export type ClientComponentOutput = {
  entryPointPath: string;
  outputPath: string;
  name: string;
  hash: string;
  exports: string[];
};

export function clientComponentMapPlugin({
  clientEntryPoints,
  onEnd,
}: {
  clientEntryPoints: string[];
  onEnd: (clientComponentOutputMap: Map<string, ClientComponentOutput>) => void;
}) {
  let plugin: Plugin = {
    name: "client-component-map-plugin",
    setup(build) {
      build.initialOptions.metafile = true;

      // maps input paths to their client exports
      let exportMap: Map<string, string[]> = new Map();

      build.onStart(() => {
        exportMap.clear();
      });

      build.onLoad({ filter: /\.(ts|tsx|js|jsx|mjs)$/ }, async ({ path }) => {
        if (shouldIgnoreUseClient(path)) {
          return null;
        }

        let contents = await readFile(path, "utf-8");
        let hasUseClient = contents.includes("use client");

        if (hasUseClient) {
          let moduleId = getModuleId(path);
          let language = pathToLanguage(path);

          let { clientExports } = await clientComponentTransform({
            input: {
              code: contents,
              language,
            },
            moduleId,
            rscClientPath: "react-server-dom-webpack/server.edge",
          });

          exportMap.set(path, clientExports);
        }

        return null;
      });

      build.onEnd((result) => {
        let metafile = result.metafile;
        if (!metafile) {
          throw new Error("Failed to get metafile");
        }

        function getHash(outputFile: string) {
          let file = outputFile.split("/").at(-1);
          let hash = file?.split("-").at(-1)?.split(".")[0];
          if (!hash) {
            throw new Error(`Failed to get hash for ${outputFile}`);
          }
          return hash;
        }

        let outputMap = new Map<string, ClientComponentOutput>();

        let outputDirPath = join(
          process.cwd(),
          build.initialOptions.outdir ?? ""
        );

        for (const outputFile in metafile.outputs) {
          let output = metafile.outputs[outputFile];
          let entryPoint = output.entryPoint;
          if (entryPoint) {
            let entryPointPath = join(process.cwd(), entryPoint);
            let isClientComponent = clientEntryPoints.includes(entryPointPath);

            if (isClientComponent) {
              let outputPath = join(process.cwd(), outputFile);
              let fileWithHash = outputPath.slice(outputDirPath.length);
              let name = fileWithHash.split("-").slice(0, -1).join("-");
              let exports = exportMap.get(entryPointPath) ?? [];

              outputMap.set(entryPointPath, {
                entryPointPath,
                outputPath,
                name,
                hash: getHash(outputFile),
                exports,
              });
            }
          }
        }

        // console.log(Object.fromEntries(outputMap.entries()));
        onEnd(outputMap);
      });
    },
  };

  return plugin;
}
