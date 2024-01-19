import { Plugin } from "esbuild";
import { fileURLToPath } from "url";
import { appSrcDir } from "../../files.js";
import * as path from "path";

export type ClientComponentOutput = {
  entryPointPath: string;
  outputPath: string;
  name: string;
  hash: string;
};

type Builder = {
  clientEntryPoints: string[];
  clientComponentOutputMap: Map<string, ClientComponentOutput>;
};

// todo change this to invoke a callback instead of taking
// a builder

export function clientComponentMapPlugin({ builder }: { builder: Builder }) {
  let plugin: Plugin = {
    name: "client-components",
    setup(build) {
      build.initialOptions.metafile = true;

      build.onEnd((result) => {
        let metafile = result.metafile;

        if (!metafile) {
          throw new Error("Failed to get metafile");
        }

        // console.log("clientEntryPoints", builder.clientEntryPoints);

        function getHash(outputFile: string) {
          let file = outputFile.split("/").at(-1);
          let hash = file?.split("-").at(-1)?.split(".")[0];
          if (!hash) {
            throw new Error(`Failed to get hash for ${outputFile}`);
          }
          return hash;
        }

        let outputMap = new Map<string, ClientComponentOutput>();

        let outputDirPath = path.join(
          process.cwd(),
          build.initialOptions.outdir ?? ""
        );

        for (const outputFile in metafile.outputs) {
          let output = metafile?.outputs[outputFile];
          let entryPoint = output.entryPoint;
          if (entryPoint) {
            let entryPointPath = path.join(process.cwd(), entryPoint);
            let isClientComponent =
              builder.clientEntryPoints.includes(entryPointPath);

            if (isClientComponent) {
              let outputPath = path.join(process.cwd(), outputFile);
              let fileWithHash = outputPath.slice(outputDirPath.length);
              let name = fileWithHash.split("-").slice(0, -1).join("-");

              outputMap.set(entryPointPath, {
                entryPointPath,
                outputPath,
                name,
                hash: getHash(outputFile),
              });
            }
          }
        }

        // console.log(Object.fromEntries(outputMap.entries()));
        builder.clientComponentOutputMap = outputMap;
      });
    },
  };

  return plugin;
}
