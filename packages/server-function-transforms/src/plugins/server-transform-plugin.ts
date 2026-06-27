import { NodePath, PluginObject, PluginPass } from "@babel/core";
import * as t from "@babel/types";
import invariant from "tiny-invariant";

let DEBUG = false;

type State = {
  moduleId: string;
  isServerModule: boolean;
  serverFunctions: Set<string>;
  registeredServerReferences: Set<string>;
  exported: Set<string>;
  encryption: {
    hasEncryptedVariables: boolean;
    module: string;
    key?: t.Expression | undefined;
  };
  getUniqueFunctionName: (name: string) => string;
};

export function ServerTransformPlugin(
  babel: any,
  options: object,
): PluginObject {
  return {
    pre() {
      let functionNameCounter = new Map<string, number>();

      invariant(
        typeof options === "object" && options !== null,
        "options must be an object",
      );
      invariant("moduleId" in options, "moduleId is required");
      invariant("encryption" in options, "encryption is required");

      let moduleId = options.moduleId;
      let encryption = options.encryption;

      invariant(typeof moduleId === "string", "moduleId must be a string");
      invariant(
        typeof encryption === "object" && encryption !== null,
        "encryption must be an object",
      );

      let encryptionModule =
        "module" in encryption ? encryption.module : undefined;
      let encryptionKey = "key" in encryption ? encryption.key : undefined;

      invariant(
        encryptionModule === undefined || typeof encryptionModule === "string",
        "encryption.module must be a string",
      );
      invariant(
        encryptionKey === undefined ||
          (isNodeLike(encryptionKey) && t.isExpression(encryptionKey)),
        "encryption.key must be an expression",
      );

      setState(this, "moduleId", moduleId);
      setState(this, "isServerModule", false);
      setState(this, "serverFunctions", new Set<string>());
      setState(this, "registeredServerReferences", new Set<string>());
      setState(this, "exported", new Set<string>());
      setState(this, "encryption", {
        hasEncryptedVariables: false,
        module: encryptionModule ?? "@twofold/server-function-transforms",
        key: encryptionKey,
      });
      setState(this, "getUniqueFunctionName", (name: string) => {
        let count = functionNameCounter.get(name) ?? 0;
        functionNameCounter.set(name, count + 1);
        return `tf$serverFunction$${count}$${name}`;
      });
    },

    visitor: {
      FunctionDeclaration(path, state) {
        if (!hasUseServerDirective(path.node.body)) {
          return;
        }

        if (isTopLevelFunction(path) && getState(state, "isServerModule")) {
          return;
        }

        let name = path.node.id?.name;
        if (name && !getState(state, "serverFunctions").has(name)) {
          let { functionDeclaration, functionName, capturedVariables } =
            createServerFunction({
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

          getState(state, "serverFunctions").add(functionName);
        }
      },
      FunctionExpression(path, state) {
        if (!hasUseServerDirective(path.node.body)) {
          return;
        }

        if (!t.isBlockStatement(path.node.body)) {
          return;
        }

        if (isTopLevelFunction(path) && getState(state, "isServerModule")) {
          return;
        }

        let { functionDeclaration, functionName, capturedVariables } =
          createServerFunction({
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

        getState(state, "serverFunctions").add(functionName);
      },
      ArrowFunctionExpression(path, state) {
        if (!t.isBlockStatement(path.node.body)) {
          return;
        }

        if (!hasUseServerDirective(path.node.body)) {
          return;
        }

        if (isTopLevelFunction(path) && getState(state, "isServerModule")) {
          return;
        }

        let { functionDeclaration, functionName, capturedVariables } =
          createServerFunction({
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

        getState(state, "serverFunctions").add(functionName);
      },
      ObjectMethod(path, state) {
        if (
          t.isIdentifier(path.node.key) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let { functionDeclaration, functionName, capturedVariables } =
            createServerFunction({
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

          getState(state, "serverFunctions").add(functionName);
        }
      },

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

              insertRegisterServerReference({
                path,
                functionName: localName,
                name: exportName,
                state,
              });

              getState(state, "serverFunctions").add(exportName);
              getState(state, "exported").add(exportName);
            }
          }
        }
      },

      Program: {
        enter(path: NodePath<t.Program>, state) {
          if (hasUseServerDirective(path.node)) {
            setState(state, "isServerModule", true);
          }
        },

        // find module decorator and transform functions
        exit(path: NodePath<t.Program>, state) {
          let serverFunctions = getState(state, "serverFunctions");
          let exported = getState(state, "exported");
          let encryption = getState(state, "encryption");
          let hasServerFunction = serverFunctions.size > 0;
          let encryptionModule = encryption.module;
          let hasEncryptedVariables = encryption.hasEncryptedVariables;
          let key = encryption.key;

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
                  t.identifier("tf$encrypt"),
                  t.identifier("encrypt"),
                ),
                t.importSpecifier(
                  t.identifier("tf$decrypt"),
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
            let exports = Array.from(serverFunctions).filter(
              (serverFunction) => !exported.has(serverFunction),
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
    throw new Error(`ServerTransformPlugin state "${key}" is missing`);
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

function isNodeLike(value: unknown): value is t.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
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
  state: PluginPass;
}) {
  let encryption = getState(state, "encryption");
  let key = encryption.key;
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

  let functionName = getState(
    state,
    "getUniqueFunctionName",
  )(originalFunctionName);
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
      insertDecryptedVariables(
        functionDeclaration,
        functionName,
        capturedVariables,
        state,
      );
    } else {
      insertBoundVariables(functionDeclaration, capturedVariables);
    }
  }

  if (capturedVariables.length > 0 && key) {
    encryption.hasEncryptedVariables = true;
  }

  return {
    functionDeclaration,
    functionName,
    capturedVariables,
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
  state: PluginPass;
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
  state: PluginPass;
}) {
  let registeredServerReferences = getState(
    state,
    "registeredServerReferences",
  );

  if (!registeredServerReferences.has(functionName)) {
    let callExpression = t.expressionStatement(
      t.callExpression(t.identifier("registerServerReference"), [
        t.identifier(functionName),
        t.stringLiteral(getState(state, "moduleId")),
        t.stringLiteral(name),
      ]),
    );

    path.insertAfter(callExpression);

    registeredServerReferences.add(functionName);
  }
}

function createBinding({
  functionName,
  capturedVariables,
  state,
}: {
  functionName: string;
  capturedVariables: string[];
  state: PluginPass;
}) {
  let functionBinding: t.CallExpression | t.Identifier;
  let encryption = getState(state, "encryption");
  let key = encryption.key;
  let moduleId = getState(state, "moduleId");

  if (capturedVariables.length > 0) {
    let binding = t.callExpression(
      t.memberExpression(t.identifier(functionName), t.identifier("bind")),
      [
        t.nullLiteral(),
        key
          ? t.callExpression(t.identifier("tf$encrypt"), [
              t.arrayExpression([
                ...capturedVariables.map((varName) => t.identifier(varName)),
                t.stringLiteral(`${moduleId}#${functionName}`),
              ]),
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
  functionName: string,
  variables: string[],
  state: PluginPass,
) {
  let body = node.body;
  let key = getState(state, "encryption").key;
  let moduleId = getState(state, "moduleId");

  if (!key || !body || !body.directives) {
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
      t.arrayPattern([
        ...variables.map((variable) => t.identifier(variable)),
        t.identifier("tf$encrypted$id"),
      ]),
      t.awaitExpression(
        t.callExpression(t.identifier("tf$decrypt"), [
          t.awaitExpression(t.identifier(`tf$encrypted$vars`)),
          key,
        ]),
      ),
    ),
  ]);

  let signatureCheck = t.ifStatement(
    t.binaryExpression(
      "!==",
      t.identifier("tf$encrypted$id"),
      t.stringLiteral(`${moduleId}#${functionName}`),
    ),
    t.blockStatement([
      t.throwStatement(
        t.newExpression(t.identifier("Error"), [
          t.stringLiteral(
            "Server function could not be invoked: Signature mismatch",
          ),
        ]),
      ),
    ]),
  );

  body.body.splice(insertIndex, 0, decryptVariables);
  body.body.splice(insertIndex + 1, 0, signatureCheck);

  if (DEBUG) {
    let debugStatement = t.expressionStatement(
      t.callExpression(t.identifier("console.log"), [
        t.stringLiteral("Decrypted variables:"),
        t.objectExpression([
          ...variables.map((variable) =>
            t.objectProperty(t.identifier(variable), t.identifier(variable)),
          ),
          t.objectProperty(
            t.identifier("tf$encrypted$id"),
            t.identifier("tf$encrypted$id"),
          ),
        ]),
      ]),
    );

    body.body.splice(insertIndex + 2, 0, debugStatement);
  }
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

  if (body[insertPosition]) {
    body[insertPosition].insertBefore(ifStatement);
  }
}

function isTopLevelFunction(
  path: NodePath<
    t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression
  >,
) {
  let parent = path.parentPath;

  if (t.isFunctionDeclaration(path.node)) {
    return parent?.isProgram() || false;
  }

  if (
    t.isFunctionExpression(path.node) ||
    t.isArrowFunctionExpression(path.node)
  ) {
    return (
      parent?.isProgram() ||
      (parent.isVariableDeclarator() &&
        parent.parentPath.isVariableDeclaration() &&
        parent.parentPath.parentPath.isProgram())
    );
  }

  return false;
}
