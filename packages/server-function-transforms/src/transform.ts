import { NodePath, PluginObj } from "@babel/core";
import { transformAsync } from "@babel/core";
import generate from "@babel/generator";
import * as t from "@babel/types";
import { transform as esbuildTransform } from "esbuild";

export async function transform({
  input,
  encryption,
  moduleId,
}: {
  input: {
    code: string;
    language: "js" | "jsx" | "ts" | "tsx";
  };
  encryption?: {
    key: t.Expression;
    module?: string;
  };
  moduleId: string;
}) {
  let jsCode;
  if (input.language !== "js") {
    let esResult = await esbuildTransform(input.code, {
      loader: input.language,
      jsx: "automatic",
      format: "esm",
    });
    jsCode = esResult.code;
  } else {
    jsCode = input.code;
  }

  let codeAst = await transformAsync(jsCode, {
    plugins: [
      [
        Plugin,
        {
          moduleId,
          encryption: {
            key: encryption?.key,
            module: encryption?.module,
          },
        },
      ],
    ],
    ast: true,
    code: false,
  });

  let ast = codeAst?.ast;
  let serverFunctions: string[] =
    codeAst?.metadata &&
    "serverFunctions" in codeAst.metadata &&
    codeAst.metadata.serverFunctions instanceof Set
      ? Array.from(codeAst.metadata.serverFunctions)
      : [];

  if (!ast) {
    throw new Error(
      "Failed to transform code. This is probably a bug in @twofold/server-function-transforms.",
    );
  }

  let result = generate.default(ast, { compact: false });

  return {
    code: result.code,
    serverFunctions,
  };
}

type Options = {
  moduleId: string;
  encryption: {
    key?: t.Expression;
    module?: string;
  };
};

type State = {
  serverFunctions: Set<string>;
  hasEncryptedVariables: boolean;
  getUniqueFunctionName: (name: string) => string;
};

export function Plugin(babel: any, options: Options): PluginObj<State> {
  let moduleId = options.moduleId;
  let key = options.encryption.key;
  let encryptionModule =
    options.encryption.module ?? "@twofold/server-function-transforms";

  return {
    pre() {
      let functionNameCounter = new Map<string, number>();

      this.serverFunctions = new Set<string>();
      this.hasEncryptedVariables = false;
      this.getUniqueFunctionName = (name: string) => {
        let count = functionNameCounter.get(name) ?? 0;
        functionNameCounter.set(name, count + 1);
        return `tf$serverFunction$${count}$${name}`;
      };
    },

    visitor: {
      FunctionDeclaration(path: NodePath<t.FunctionDeclaration>, state: State) {
        if (hasUseServerDirective(path.node.body)) {
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
              key,
            });

            insertFunctionIntoProgram({
              functionDeclaration,
              moduleId,
              path,
            });

            let binding = createBinding({
              functionName,
              capturedVariables,
              key,
            });

            let assignNameToServerFunction = t.variableDeclaration("const", [
              t.variableDeclarator(t.identifier(name), binding),
            ]);

            path.replaceWith(assignNameToServerFunction);

            if (hasEncryptedVariables) {
              state.hasEncryptedVariables = true;
            }

            state.serverFunctions.add(functionName);
          }
        }
      },
      FunctionExpression(path: NodePath<t.FunctionExpression>, state: State) {
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
            key,
          });

          insertFunctionIntoProgram({
            functionDeclaration,
            moduleId,
            path,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            key,
          });

          path.replaceWith(binding);

          if (hasEncryptedVariables) {
            state.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },
      ArrowFunctionExpression(
        path: NodePath<t.ArrowFunctionExpression>,
        state: State,
      ) {
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
            key,
          });

          insertFunctionIntoProgram({
            functionDeclaration,
            moduleId,
            path,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            key,
          });

          path.replaceWith(binding);

          if (hasEncryptedVariables) {
            state.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },
      ObjectMethod(path: NodePath<t.ObjectMethod>, state: State) {
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
            key,
          });

          insertFunctionIntoProgram({
            functionDeclaration,
            moduleId,
            path,
          });

          let binding = createBinding({
            functionName,
            capturedVariables,
            key,
          });

          let newProperty = t.objectProperty(
            t.identifier(path.node.key.name),
            binding,
          );

          path.replaceWith(newProperty);

          if (hasEncryptedVariables) {
            state.hasEncryptedVariables = true;
          }

          state.serverFunctions.add(functionName);
        }
      },
      Program: {
        // find module decorator and transform functions
        exit(path: NodePath<t.Program>, state: State) {
          let hasServerFunction = state.serverFunctions.size > 0;
          let hasEncryptedVariables = state.hasEncryptedVariables;

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
            let exportDeclaration = t.exportNamedDeclaration(
              null,
              Array.from(state.serverFunctions).map((serverFunction) =>
                t.exportSpecifier(
                  t.identifier(serverFunction),
                  t.identifier(serverFunction),
                ),
              ),
            );
            path.pushContainer("body", exportDeclaration);
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

function hasUseServerDirective(body: t.BlockStatement | undefined) {
  if (!body || !body.directives) return false;
  return body.directives.some((directive) =>
    t.isDirectiveLiteral(directive.value, { value: "use server" }),
  );
}

function createServerFunction({
  path,
  state,
  key,
}: {
  path: NodePath<
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ObjectMethod
  >;
  state: State;
  key?: t.Expression;
}) {
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
  moduleId,
}: {
  functionDeclaration: t.FunctionDeclaration;
  moduleId: string;
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
  let functionName = getFunctionName(newFunctionPath);

  insertRegisterServerReference(newFunctionPath, functionName, moduleId);

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

function insertRegisterServerReference(
  path: NodePath,
  functionName: string,
  moduleId: string,
) {
  let callExpression = t.expressionStatement(
    t.callExpression(t.identifier("registerServerReference"), [
      t.identifier(functionName),
      t.stringLiteral(moduleId),
      t.stringLiteral(functionName),
    ]),
  );

  path.insertAfter(callExpression);
}

function createBinding({
  functionName,
  capturedVariables,
  key,
}: {
  functionName: string;
  capturedVariables: string[];
  key?: t.Expression;
}) {
  let functionBinding: t.CallExpression | t.Identifier;
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

      // Ensure the identifier is part of a reference, not a declaration
      if (
        !innerPath.isReferenced() || // Skip identifiers that are not references
        path.scope.hasOwnBinding(name) // Skip if declared within the function (includes parameters)
      ) {
        return;
      }

      // Check if the variable is defined in an outer scope
      let binding = path.scope.getBinding(name);
      if (binding && !binding.scope.parent) {
        return;
      }

      if (binding && binding.scope !== path.scope) {
        // Add variables from outer scopes
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
