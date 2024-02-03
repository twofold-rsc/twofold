import { Plugin, transform } from "esbuild";
import { RSCBuilder } from "../rsc-builder";
import { readFile } from "fs/promises";
import type {
  FunctionDeclaration,
  ExportNamedDeclaration,
  Program,
} from "estree";
import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import * as astring from "astring";
import { fileURLToPath } from "url";
import { cwdUrl } from "../../files.js";
import { createHash } from "crypto";
import { basename, extname } from "path";
import * as path from "path";

type ModuleState = {
  actions: FunctionDeclaration[];
  exports: ExportNamedDeclaration[];
};

type ServerAction = {
  id: string;
  path: string;
  export: string;
};

export function serverActionsPlugin({ builder }: { builder: RSCBuilder }) {
  let plugin: Plugin = {
    name: "server-actions",
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
        let hasAction = contents.includes('"use server";\n');

        if (hasAction) {
          // console.log("path has a use server", path);

          let md5 = createHash("md5").update(path).digest("hex");
          let name = basename(path, extname(path));
          let moduleId = `${name}-${md5}`;
          // console.log("module", moduleId);

          let { code } = await transform(contents, {
            loader: "tsx",
            jsx: "automatic",
            format: "esm",
          });

          let state: ModuleState = {
            actions: [],
            exports: [],
          };

          let ast = acorn.parse(code, {
            ecmaVersion: "latest",
            sourceType: "module",
          });

          acornWalk.ancestor(ast, {
            FunctionDeclaration(_node, _, ancestors) {
              let node = _node as unknown as FunctionDeclaration;
              if (node.body.type === "BlockStatement" && node.body.body[0]) {
                let firstStatement = node.body.body[0];
                if (
                  firstStatement.type === "ExpressionStatement" &&
                  firstStatement.expression.type === "Literal" &&
                  firstStatement.expression.value === "use server"
                ) {
                  // console.log("Found a use server");
                  // console.log(node);
                  // console.log(state);
                  // console.log(ancestors);

                  // verify top level
                  // todo

                  // save state
                  state.actions.push(node);
                }
              }
            },
            ExportNamedDeclaration(node) {
              state.exports.push(node as unknown as ExportNamedDeclaration);
            },
          });

          for (let node of state.actions) {
            let index = (ast as unknown as Program).body.indexOf(node);
            let name = node.id?.name;

            if (!name) {
              // todo
              throw new Error("No name found");
            }

            let id = `${moduleId}#${name}`;

            let referenceCode = `
                ${name}.$$typeof = Symbol.for("react.server.reference");
                ${name}.$$id = "${id}";
                ${name}.$$bound = null;
                `;

            serverActions.add({
              id,
              path,
              export: name,
            });

            let tree = acorn.parse(referenceCode, {
              ecmaVersion: "latest",
            });

            for (let exportNode of state.exports) {
              let specifiers = exportNode.specifiers;

              let isExported = specifiers.some((specifier) => {
                return (
                  specifier.exported.name === name &&
                  specifier.local.name === name
                );
              });

              // make sure this name isn't already exported as something else

              if (!isExported) {
                exportNode.specifiers.push({
                  type: "ExportSpecifier",
                  local: { type: "Identifier", name: name },
                  exported: { type: "Identifier", name: name },
                });
              }
            }

            ast.body.splice(index + 1, 0, ...tree.body);
          }

          return {
            contents: astring.generate(ast),
            loader: "js",
          };
        }
      });

      build.onEnd((result) => {
        // console.log(result);
        // console.log(serverActions);

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
              path: outputPath,
              export: action.export,
            });
          });
        }

        // console.log(builder.serverActionMap);
      });
    },
  };

  return plugin;
}
