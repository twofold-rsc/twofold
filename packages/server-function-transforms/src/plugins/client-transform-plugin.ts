import { NodePath, PluginObject, PluginPass, traverse } from "@babel/core";
import * as t from "@babel/types";
import invariant from "tiny-invariant";

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
  options: object,
): PluginObject {
  return {
    pre() {
      invariant(
        typeof options === "object" && options !== null,
        "options must be an object",
      );
      invariant("moduleId" in options, "moduleId is required");
      invariant("callServerModule" in options, "callServerModule is required");

      let moduleId = options.moduleId;
      let callServerModule = options.callServerModule;

      invariant(typeof moduleId === "string", "moduleId must be a string");
      invariant(
        typeof callServerModule === "string",
        "callServerModule must be a string",
      );

      setState(this, "moduleId", moduleId);
      setState(this, "callServerModule", callServerModule);
      setState(this, "isServerModule", false);
      setState(this, "serverFunctions", new Set<string>());
    },

    visitor: {
      ExportNamedDeclaration(path, state) {
        if (getState(state, "isServerModule")) {
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

              getState(state, "serverFunctions").add(exportName);
            }
          }
        }
      },

      Program: {
        enter(path: NodePath<t.Program>, state) {
          setState(state, "isServerModule", hasUseServerDirective(path.node));
        },

        exit(path: NodePath<t.Program>, state) {
          let serverFunctions = getState(state, "serverFunctions");
          let hasServerFunction = serverFunctions.size > 0;
          let isServerModule = getState(state, "isServerModule");
          let callServerModule = getState(state, "callServerModule");
          let moduleId = getState(state, "moduleId");

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
                  t.stringLiteral(callServerModule),
                );

                path.pushContainer("body", createServerReferenceImport);
                path.pushContainer("body", callServerImport);

                for (let exported of serverFunctions) {
                  let exportLine = createExportedServerReference(
                    exported,
                    moduleId,
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
        serverFunctions: getState(this, "serverFunctions"),
      };
    },
  };
}

function setState<K extends keyof State>(
  state: PluginPass,
  key: K,
  value: State[K],
): void {
  state.set(key, value);
}

function getState<K extends keyof State>(state: PluginPass, key: K): State[K] {
  let value = state.get(key) as State[K] | undefined;

  if (value === undefined) {
    throw new Error(`ClientTransformPlugin state "${key}" is missing`);
  }

  return value;
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
