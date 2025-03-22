import { NodePath, PluginObj, traverse } from "@babel/core";
import * as t from "@babel/types";

type Options = {
  moduleId: string;
  callServerModule: string;
};

type State = {
  moduleId: string;
  callServerModule: string;
  isServerModule: boolean;
  serverFunctions: Set<string>;
};

export function ClientTransformPlugin(
  babel: any,
  options: Options,
): PluginObj<State> {
  return {
    pre() {
      this.moduleId = options.moduleId;
      this.callServerModule = options.callServerModule;
      this.isServerModule = false;
      this.serverFunctions = new Set<string>();
    },

    visitor: {
      ExportNamedDeclaration(path, state) {
        if (state.isServerModule) {
          let { specifiers } = path.node;

          // we turn default into a specifier before running through babel,
          // so this should cover the export default case
          for (let specifier of specifiers) {
            if (
              t.isExportSpecifier(specifier) &&
              t.isIdentifier(specifier.exported)
            ) {
              let exportName = specifier.exported.name;
              let localName = specifier.local.name;

              state.serverFunctions.add(exportName);
            }
          }
        }
      },

      Program: {
        enter(path: NodePath<t.Program>, state: State) {
          state.isServerModule = hasUseServerDirective(path.node);
        },

        exit(path: NodePath<t.Program>, state: State) {
          let hasServerFunction = state.serverFunctions.size > 0;
          let isServerModule = state.isServerModule;

          if (isServerModule && hasServerFunction) {
            let newProgram = t.program([]);
            traverse(t.file(newProgram), {
              Program(path) {
                let createServerReferenceImport = t.importDeclaration(
                  [
                    t.importSpecifier(
                      t.identifier("createServerReference"),
                      t.identifier("createServerReference"),
                    ),
                  ],
                  t.stringLiteral("react-server-dom-webpack/client"),
                );

                let callServerImport = t.importDeclaration(
                  [
                    t.importSpecifier(
                      t.identifier("callServer"),
                      t.identifier("callServer"),
                    ),
                  ],
                  t.stringLiteral(state.callServerModule),
                );

                path.pushContainer("body", createServerReferenceImport);
                path.pushContainer("body", callServerImport);

                for (let exported of state.serverFunctions) {
                  let exportLine = createExportedServerReference(
                    exported,
                    state.moduleId,
                  );

                  path.pushContainer("body", exportLine);
                }
              },
            });

            // replace the existing program with our new one
            path.replaceWith(newProgram);
          }
        },
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        serverFunctions: this.serverFunctions,
      };
    },
  };
}

function hasUseServerDirective(
  block: t.BlockStatement | t.Program | undefined,
) {
  if (!block || !block.directives) return false;
  return block.directives.some((directive) =>
    t.isDirectiveLiteral(directive.value, { value: "use server" }),
  );
}

function createExportedServerReference(name: string, moduleId: string) {
  let callExpression = t.callExpression(t.identifier("createServerReference"), [
    t.stringLiteral(`${moduleId}#${name}`),
    t.identifier("callServer"),
    t.stringLiteral(`${moduleId}#${name}`),
  ]);

  return name === "default"
    ? t.exportDefaultDeclaration(callExpression)
    : t.exportNamedDeclaration(
        t.variableDeclaration("const", [
          t.variableDeclarator(t.identifier(name), callExpression),
        ]),
        [],
      );
}
