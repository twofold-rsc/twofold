import { Plugin } from "esbuild";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { cwdUrl } from "../../files.js";
import { extname } from "path";
import * as path from "path";
import {
  transform as serverFunctionTransform,
  envKey,
} from "@twofold/server-function-transforms";
import { z } from "zod";
import { getModuleId } from "../helpers/module.js";

type ServerAction = {
  id: string;
  path: string;
  moduleId: string;
  export: string;
};

let languageSchema = z.union([
  z.literal("ts"),
  z.literal("tsx"),
  z.literal("js"),
  z.literal("jsx"),
]);

export function serverActionsPlugin({ builder }: { builder: RSCBuilder }) {
  let plugin: Plugin = {
    name: "server-actions-plugin",
    setup(build) {
      build.initialOptions.metafile = true;
      let serverActions = new Set<ServerAction>();

      function getPathActions(path: string) {
        return Array.from(serverActions).filter(
          (action) => action.path === path,
        );
      }

      build.onStart(() => {
        serverActions.clear();
      });

      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async ({ path }) => {
        let contents = await readFile(path, "utf-8");
        let hasUseServer = contents.includes("use server");

        if (hasUseServer) {
          let moduleId = getModuleId(path);
          let extension = extname(path).slice(1);
          let language = languageSchema.parse(extension);

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
            builder.serverActionMap.set(action.id, {
              id: action.id,
              moduleId: action.moduleId,
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
