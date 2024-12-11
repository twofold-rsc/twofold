import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";

type Options = {
  moduleId: string;
  encryption: {
    key?: t.Expression;
    module?: string;
  };
};

type State = {
  moduleId: string;
  isServerModule: boolean;
  serverFunctions: Set<string>;
  registeredServerReferences: Set<string>;
  exported: Set<string>;
  encryption: {
    hasEncryptedVariables: boolean;
    module: string;
    key?: t.Expression;
  };
  getUniqueFunctionName: (name: string) => string;
};

export function ServerTransformPlugin(
  babel: any,
  options: Options,
): PluginObj<State> {
  return {
    pre() {
      let functionNameCounter = new Map<string, number>();

      this.moduleId = options.moduleId;
      this.isServerModule = false;
      this.serverFunctions = new Set<string>();
      this.registeredServerReferences = new Set<string>();
      this.exported = new Set<string>();
      this.encryption = {
        hasEncryptedVariables: false,
        module:
          options.encryption.module ?? "@twofold/server-function-transforms",
        key: options.encryption.key,
      };
      this.getUniqueFunctionName = (name: string) => {
        let count = functionNameCounter.get(name) ?? 0;
        functionNameCounter.set(name, count + 1);
        return `tf$serverFunction$${count}$${name}`;
      };
    },

    visitor: {
      FunctionDeclaration(path, state) {
        if (!hasUseServerDirective(path.node.body)) {
          return;
        }

        if (isTopLevelFunction(path) && state.isServerModule) {
          return;
        }

        let name = path.node.id?.name;
        if (name && !state.serverFunctions.has(name)) {
          let {
            functionDeclaration,
            functionName,
            capturedVariables,
            hasEncryptedVariables,
          } = createServerFunction({
            path,
            state,
          });

          let newFunctionPath = insertFunctionIntoProgram({
            functionDeclaration,
            path,
          });
          registerServerFunction({
            path: newFunctionPath,
            state,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            state,
          });

          let assignNameToServerFunction = t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier(name), binding),
          ]);

          path.replaceWith(assignNameToServerFunction);

          if (hasEncryptedVariables) {
            state.encryption.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },
      FunctionExpression(path, state) {
        if (
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let {
            functionDeclaration,
            functionName,
            capturedVariables,
            hasEncryptedVariables,
          } = createServerFunction({
            path,
            state,
          });

          let newFunctionPath = insertFunctionIntoProgram({
            path,
            functionDeclaration,
          });
          registerServerFunction({
            path: newFunctionPath,
            state,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            state,
          });

          path.replaceWith(binding);

          if (hasEncryptedVariables) {
            state.encryption.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },
      ArrowFunctionExpression(path, state) {
        if (
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let {
            functionDeclaration,
            functionName,
            capturedVariables,
            hasEncryptedVariables,
          } = createServerFunction({
            path,
            state,
          });

          let newFunction = insertFunctionIntoProgram({
            functionDeclaration,
            path,
          });
          registerServerFunction({
            path: newFunction,
            state,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            state,
          });

          path.replaceWith(binding);

          if (hasEncryptedVariables) {
            state.encryption.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },
      ObjectMethod(path, state) {
        if (
          t.isIdentifier(path.node.key) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let {
            functionDeclaration,
            functionName,
            capturedVariables,
            hasEncryptedVariables,
          } = createServerFunction({
            path,
            state,
          });

          let newFunction = insertFunctionIntoProgram({
            functionDeclaration,
            path,
          });
          registerServerFunction({
            path: newFunction,
            state,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            state,
          });

          let newProperty = t.objectProperty(
            t.identifier(path.node.key.name),
            binding,
          );

          path.replaceWith(newProperty);

          if (hasEncryptedVariables) {
            state.encryption.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },

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

              insertRegisterServerReference({
                path,
                functionName: localName,
                name: exportName,
                state,
              });

              state.serverFunctions.add(exportName);
              state.exported.add(exportName);
            }
          }
        }
      },

      Program: {
        enter(path: NodePath<t.Program>, state: State) {
          if (hasUseServerDirective(path.node)) {
            state.isServerModule = true;
          }
        },

        // find module decorator and transform functions
        exit(path: NodePath<t.Program>, state: State) {
          let hasServerFunction = state.serverFunctions.size > 0;
          let encryptionModule = state.encryption.module;
          let hasEncryptedVariables = state.encryption.hasEncryptedVariables;
          let key = state.encryption.key;

          // import registerServerReference
          if (hasServerFunction) {
            let importDeclaration = t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier("registerServerReference"),
                  t.identifier("registerServerReference"),
                ),
              ],
              t.stringLiteral("react-server-dom-webpack/server.edge"),
            );
            path.unshiftContainer("body", importDeclaration);
          }

          // import encryption functions
          if (hasEncryptedVariables && key) {
            let importDeclaration = t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier("encrypt"),
                  t.identifier("encrypt"),
                ),
                t.importSpecifier(
                  t.identifier("decrypt"),
                  t.identifier("decrypt"),
                ),
              ],
              t.stringLiteral(encryptionModule),
            );
            path.unshiftContainer("body", importDeclaration);
            insertKeyCheck(path, key);
          }

          // make sure all server functions are exported
          if (hasServerFunction) {
            let exports = Array.from(state.serverFunctions).filter(
              (serverFunction) => !state.exported.has(serverFunction),
            );
            if (exports.length > 0) {
              let exportDeclaration = t.exportNamedDeclaration(
                null,
                exports.map((serverFunction) =>
                  t.exportSpecifier(
                    t.identifier(serverFunction),
                    t.identifier(serverFunction),
                  ),
                ),
              );
              path.pushContainer("body", exportDeclaration);
            }
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

function createServerFunction({
  path,
  state,
}: {
  path: NodePath<
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ObjectMethod
  >;
  state: State;
}) {
  let key = state.encryption.key;
  let originalFunctionName = getFunctionName(path);
  let capturedVariables = getCapturedVariables(path);

  // functions that use encrypted variables must be async
  if (capturedVariables.length > 0 && key && !path.node.async) {
    throw new Error(
      `Server functions that close over variables must be async. Please turn ${originalFunctionName} into an async function.`,
    );
  }

  if (!t.isBlockStatement(path.node.body)) {
    throw new Error(
      `Server functions must have a block body. Please convert ${originalFunctionName} to a block function.`,
    );
  }

  let functionName = state.getUniqueFunctionName(originalFunctionName);
  let params = path.node.params.map((param) => t.cloneNode(param));
  let newParams = [
    ...(capturedVariables.length > 0
      ? [t.identifier(`tf$${key ? "encrypted" : "bound"}$vars`)]
      : []),
    ...params,
  ];
  let functionDeclaration = t.functionDeclaration(
    t.identifier(functionName),
    newParams,
    path.node.body,
    false, // generator
    path.node.async, // async
  );

  if (capturedVariables.length > 0) {
    if (key) {
      insertDecryptedVariables(functionDeclaration, capturedVariables, key);
    } else {
      insertBoundVariables(functionDeclaration, capturedVariables);
    }
  }

  return {
    functionDeclaration,
    functionName,
    capturedVariables,
    hasEncryptedVariables: capturedVariables.length > 0 && key,
  };
}

function insertFunctionIntoProgram({
  functionDeclaration,
  path,
}: {
  functionDeclaration: t.FunctionDeclaration;
  path: NodePath<
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ObjectMethod
  >;
}) {
  let underProgramPath = findParentUnderProgram(path);
  if (!underProgramPath) {
    throw new Error(
      "Failed to find parent program node. This is a bug in @twofold/server-function-transforms.",
    );
  }

  let [newFunctionPath] = underProgramPath.insertBefore(functionDeclaration);

  // registerServerFunction(newFunctionPath, moduleId);

  return newFunctionPath;
}

function findParentUnderProgram(path: NodePath) {
  if (path.parentPath?.isProgram()) {
    return path;
  }

  let underProgramPath = path.findParent(
    (p) => p.parentPath?.isProgram() ?? false,
  );

  return underProgramPath;
}

function registerServerFunction({
  path,
  state,
  name,
}: {
  path: NodePath<t.FunctionDeclaration>;
  state: State;
  name?: string;
}) {
  let functionName = getFunctionName(path);

  if (!functionName) {
    throw new Error(
      "Failed to find function name. This is a bug in @twofold/server-function-transforms.",
    );
  }

  if (!name) {
    name = functionName;
  }

  insertRegisterServerReference({
    path,
    functionName,
    name,
    state,
  });
}

function insertRegisterServerReference({
  path,
  functionName,
  name,
  state,
}: {
  path: NodePath;
  functionName: string;
  name: string;
  state: State;
}) {
  if (!state.registeredServerReferences.has(functionName)) {
    let callExpression = t.expressionStatement(
      t.callExpression(t.identifier("registerServerReference"), [
        t.identifier(functionName),
        t.stringLiteral(state.moduleId),
        t.stringLiteral(name),
      ]),
    );

    path.insertAfter(callExpression);

    state.registeredServerReferences.add(functionName);
  }
}

function createBinding({
  functionName,
  capturedVariables,
  state,
}: {
  functionName: string;
  capturedVariables: string[];
  state: State;
}) {
  let functionBinding: t.CallExpression | t.Identifier;
  let key = state.encryption.key;

  if (capturedVariables.length > 0) {
    let binding = t.callExpression(
      t.memberExpression(t.identifier(functionName), t.identifier("bind")),
      [
        t.nullLiteral(),
        key
          ? t.callExpression(t.identifier("encrypt"), [
              t.arrayExpression(
                capturedVariables.map((varName) => t.identifier(varName)),
              ),
              key,
            ])
          : t.arrayExpression(
              capturedVariables.map((varName) => t.identifier(varName)),
            ),
      ],
    );
    functionBinding = binding;
  } else {
    functionBinding = t.identifier(functionName);
  }

  return functionBinding;
}

function insertBoundVariables(
  node: t.FunctionDeclaration,
  variables: string[],
) {
  let body = node.body;

  if (!body || !body.directives) {
    return;
  }

  let insertIndex = body.directives.findIndex(
    (directive) =>
      t.isDirectiveLiteral(directive.value) &&
      directive.value.value === "use server",
  );

  if (insertIndex === -1) {
    insertIndex = 0;
  }

  let createVariables = t.variableDeclaration("let", [
    t.variableDeclarator(
      t.arrayPattern(variables.map((variable) => t.identifier(variable))),
      t.identifier("tf$bound$vars"),
    ),
  ]);

  body.body.splice(insertIndex, 0, createVariables);
  // body.body.unshift(createVariables);
}

function insertDecryptedVariables(
  node: t.FunctionDeclaration,
  variables: string[],
  key: t.ArgumentPlaceholder | t.Expression,
) {
  let body = node.body;

  if (!body || !body.directives) {
    return;
  }

  let insertIndex = body.directives.findIndex(
    (directive) =>
      t.isDirectiveLiteral(directive.value) &&
      directive.value.value === "use server",
  );

  if (insertIndex === -1) {
    return;
  }

  let decryptVariables = t.variableDeclaration("let", [
    t.variableDeclarator(
      t.arrayPattern(variables.map((variable) => t.identifier(variable))),
      t.awaitExpression(
        t.callExpression(t.identifier("decrypt"), [
          t.awaitExpression(t.identifier(`tf$encrypted$vars`)),
          key,
        ]),
      ),
    ),
  ]);

  body.body.splice(insertIndex, 0, decryptVariables);
  // body.body.unshift(decryptVariables);
}

function getFunctionName(
  path: NodePath<
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ObjectMethod
  >,
) {
  if (t.isObjectMethod(path.node) && t.isIdentifier(path.node.key)) {
    return path.node.key.name;
  }

  if (t.isFunctionDeclaration(path.node) && path.node.id) {
    return path.node.id.name;
  }

  let parent = path.parent;

  if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
    return parent.id.name;
  }

  if (t.isObjectProperty(parent) && t.isIdentifier(parent.key)) {
    return parent.key.name;
  }

  return "anonymous";
}

function getCapturedVariables(
  path: NodePath<
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ObjectMethod
  >,
): string[] {
  const capturedVariables = new Set<string>();

  path.traverse({
    Identifier(innerPath) {
      let name = innerPath.node.name;

      // make sure the identifier is part of a reference, not a declaration
      if (
        !innerPath.isReferenced() || // skip non references
        path.scope.hasOwnBinding(name) // skip if declared within the function or parameters
      ) {
        return;
      }

      // check if the variable is defined in an outer scope
      let binding = path.scope.getBinding(name);
      if (binding && !binding.scope.parent) {
        return;
      }

      if (binding && binding.scope !== path.scope) {
        // add variables from outer scopes
        capturedVariables.add(name);
      }
    },
  });

  return Array.from(capturedVariables);
}

function insertKeyCheck(path: NodePath<t.Program>, key: t.Expression) {
  let ifStatement = t.ifStatement(
    t.binaryExpression(
      "!==",
      t.unaryExpression("typeof", key),
      t.stringLiteral("string"),
    ),
    t.blockStatement([
      t.throwStatement(
        t.newExpression(t.identifier("Error"), [
          t.stringLiteral(
            `Invalid key. Encryption key is missing or undefined.`,
          ),
        ]),
      ),
    ]),
  );

  let body = path.get("body");
  let firstNonImportIndex = body.findIndex(
    (p) => !t.isImportDeclaration(p.node),
  );

  let insertPosition =
    firstNonImportIndex === -1 ? body.length : firstNonImportIndex;

  body[insertPosition].insertBefore(ifStatement);
}

function isTopLevelFunction(path: NodePath<t.FunctionDeclaration>): boolean {
  return path.parentPath?.isProgram() || false;
}
