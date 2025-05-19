import { Plugin } from "esbuild";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { cwdUrl } from "../../files.js";
import * as path from "path";
import {
  transform as serverFunctionTransform,
  envKey,
} from "@twofold/server-function-transforms";
import { getModuleId } from "../helpers/module.js";
import { pathToLanguage } from "../helpers/languages.js";
import { shouldIgnoreUseServer } from "../helpers/excluded.js";

type ServerAction = {
  id: string;
  path: string;
  moduleId: string;
  export: string;
};

export function serverActionsPlugin({ builder }: { builder: RSCBuilder }) {
  let plugin: Plugin = {
    name: "server-actions-plugin",
    setup(build) {
      build.initialOptions.metafile = true;
      let serverActions = new Set<ServerAction>();

      function getPathActions(path: string) {
        return Array.from(serverActions).filter(
          (action) => action.path === path
        );
      }

      build.onStart(() => {
        serverActions.clear();
      });

      build.onLoad({ filter: /\.(ts|tsx|js|jsx|mjs)$/ }, async ({ path }) => {
        if (shouldIgnoreUseServer(path)) {
          return null;
        }

        let contents = await readFile(path, "utf-8");
        let hasUseServer = contents.includes("use server");

        if (hasUseServer) {
          let moduleId = getModuleId(path);
          let language = pathToLanguage(path);

          let transformed = await serverFunctionTransform({
            input: {
              code: contents,
              language,
            },
            encryption: {
              key: envKey("TWOFOLD_SECRET_KEY"),
              module: "@twofold/framework/encryption",
            },
            moduleId,
          });

          for (let serverFunction of transformed.serverFunctions) {
            serverActions.add({
              id: `${moduleId}#${serverFunction}`,
              path,
              moduleId,
              export: serverFunction,
            });
          }

          return {
            contents: transformed.code,
            loader: "js",
          };
        }
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

        let outputs = metafile.outputs;

        for (let outputFile in outputs) {
          let output = outputs[outputFile];
          let inputs = output.inputs;
          let inputFiles = Object.keys(inputs);

          let fullInputPaths = inputFiles.map((inputFile) => {
            return fileURLToPath(new URL(`./${inputFile}`, cwdUrl));
          });

          let actions = fullInputPaths.flatMap((fullInputPath) => {
            return getPathActions(fullInputPath);
          });

          actions.forEach((action) => {
            let outputPath = path.join(fileURLToPath(cwdUrl), outputFile);
            let hash = getHash(outputFile);
            builder.serverActionMap.set(action.id, {
              id: action.id,
              moduleId: action.moduleId,
              hash: hash,
              path: outputPath,
              export: action.export,
            });
          });
        }
      });
    },
  };

  return plugin;
}
