import { NodePath, PluginObj, Node, PluginPass } from "@babel/core";
import { transformAsync } from "@babel/core";
import generate from "@babel/generator";
import { GeneratorOptions, GeneratorResult } from "@babel/generator";
import * as t from "@babel/types";

export async function transform({
  code,
  moduleId,
}: {
  code: string;
  moduleId: string;
}) {
  let codeAst = await transformAsync(code, {
    plugins: [[Plugin, { moduleId }]],
    ast: true,
    code: false,
  });

  let ast = codeAst?.ast;
  let serverFunctions =
    codeAst?.metadata && "serverFunctions" in codeAst.metadata
      ? codeAst.metadata.serverFunctions
      : [];

  if (!ast) {
    return {
      code,
      serverFunctions,
    };
  }

  let result = generateCode(ast, { compact: false });

  return {
    code: result.code,
    serverFunctions,
  };
}

function generateCode(ast: Node, options?: GeneratorOptions): GeneratorResult {
  // @ts-ignore
  return generate(ast, options);
}

type Options = {
  moduleId: string;
};

type State = {
  serverFunctions: Set<string>;
  getUniqueFunctionName: () => string;
};

export function Plugin(babel: any, options: Options): PluginObj<State> {
  let moduleId = options.moduleId;
  let functionNameCounter = 0;

  return {
    pre() {
      this.serverFunctions = new Set<string>(); // Track "use server" function names
      this.getUniqueFunctionName = () => {
        return `tf$serverFunction${functionNameCounter++}`;
      };
    },

    visitor: {
      FunctionDeclaration(path: NodePath<t.FunctionDeclaration>, state: State) {
        if (hasUseServerDirective(path.node.body)) {
          let name = path.node.id?.name;
          if (name && !state.serverFunctions.has(name)) {
            let capturedVariables = getCapturedVariables(path);
            let params = path.node.params.map((param) => t.cloneNode(param));
            let newParams = [
              ...capturedVariables.map((varName) => t.identifier(varName)),
              ...params,
            ];
            let functionName = state.getUniqueFunctionName();
            let functionDeclaration = t.functionDeclaration(
              t.identifier(functionName),
              newParams,
              path.node.body,
            );

            let underProgramPath = findParentUnderProgram(path);
            if (!underProgramPath) {
              return;
            }

            let [newFunctionPath] =
              underProgramPath.insertBefore(functionDeclaration);
            insertRegisterServerReference(
              newFunctionPath,
              functionName,
              moduleId,
            );

            let assignTo: t.CallExpression | t.Identifier;
            if (capturedVariables.length > 0) {
              let binding = t.callExpression(
                t.memberExpression(
                  t.identifier(functionName),
                  t.identifier("bind"),
                ),
                [
                  t.nullLiteral(),
                  ...capturedVariables.map((varName) => t.identifier(varName)),
                ],
              );
              assignTo = binding;
            } else {
              assignTo = t.identifier(functionName);
            }

            let assignToServerFunction = t.variableDeclaration("const", [
              t.variableDeclarator(t.identifier(name), assignTo),
            ]);

            path.replaceWith(assignToServerFunction);

            state.serverFunctions.add(functionName);
          }
        }
      },
      FunctionExpression(path: NodePath<t.FunctionExpression>, state: State) {
        if (
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let capturedVariables = getCapturedVariables(path);
          let params = path.node.params.map((param) => t.cloneNode(param));
          let newParams = [
            ...capturedVariables.map((varName) => t.identifier(varName)),
            ...params,
          ];
          let functionName = state.getUniqueFunctionName();
          let functionDeclaration = t.functionDeclaration(
            t.identifier(functionName),
            newParams,
            path.node.body,
          );

          let underProgramPath = findParentUnderProgram(path);
          if (!underProgramPath) {
            return;
          }

          let [newFunctionPath] =
            underProgramPath.insertBefore(functionDeclaration);
          insertRegisterServerReference(
            newFunctionPath,
            functionName,
            moduleId,
          );

          let assignTo: t.CallExpression | t.Identifier;
          if (capturedVariables.length > 0) {
            let binding = t.callExpression(
              t.memberExpression(
                t.identifier(functionName),
                t.identifier("bind"),
              ),
              [
                t.nullLiteral(),
                ...capturedVariables.map((varName) => t.identifier(varName)),
              ],
            );
            assignTo = binding;
          } else {
            assignTo = t.identifier(functionName);
          }

          path.replaceWith(assignTo);

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
          let capturedVariables = getCapturedVariables(path);
          let params = path.node.params.map((param) => t.cloneNode(param));
          let newParams = [
            ...capturedVariables.map((varName) => t.identifier(varName)),
            ...params,
          ];
          let functionName = state.getUniqueFunctionName();
          let functionDeclaration = t.functionDeclaration(
            t.identifier(functionName),
            newParams,
            path.node.body,
          );

          let underProgramPath = findParentUnderProgram(path);
          if (!underProgramPath) {
            return;
          }

          let [newFunctionPath] =
            underProgramPath.insertBefore(functionDeclaration);
          insertRegisterServerReference(
            newFunctionPath,
            functionName,
            moduleId,
          );

          let assignTo: t.CallExpression | t.Identifier;
          if (capturedVariables.length > 0) {
            let binding = t.callExpression(
              t.memberExpression(
                t.identifier(functionName),
                t.identifier("bind"),
              ),
              [
                t.nullLiteral(),
                ...capturedVariables.map((varName) => t.identifier(varName)),
              ],
            );
            assignTo = binding;
          } else {
            assignTo = t.identifier(functionName);
          }

          path.replaceWith(assignTo);

          state.serverFunctions.add(functionName);
        }
      },
      ObjectMethod(path: NodePath<t.ObjectMethod>, state: State) {
        if (
          t.isIdentifier(path.node.key) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let capturedVariables = getCapturedVariables(path);
          let params = path.node.params.map((param) => t.cloneNode(param));
          let newParams = [
            ...capturedVariables.map((varName) => t.identifier(varName)),
            ...params,
          ];
          let functionName = state.getUniqueFunctionName();
          let functionDeclaration = t.functionDeclaration(
            t.identifier(functionName),
            newParams,
            path.node.body,
          );

          let underProgramPath = findParentUnderProgram(path);
          if (!underProgramPath) {
            return;
          }

          let [newFunctionPath] =
            underProgramPath.insertBefore(functionDeclaration);
          insertRegisterServerReference(
            newFunctionPath,
            functionName,
            moduleId,
          );

          let assignTo: t.CallExpression | t.Identifier;
          if (capturedVariables.length > 0) {
            let binding = t.callExpression(
              t.memberExpression(
                t.identifier(functionName),
                t.identifier("bind"),
              ),
              [
                t.nullLiteral(),
                ...capturedVariables.map((varName) => t.identifier(varName)),
              ],
            );
            assignTo = binding;
          } else {
            assignTo = t.identifier(functionName);
          }

          let newProperty = t.objectProperty(
            t.identifier(path.node.key.name),
            assignTo,
          );

          path.replaceWith(newProperty);

          state.serverFunctions.add(functionName);
        }
      },
      Program: {
        exit(path: NodePath<t.Program>, state: State) {
          let hasServerFunction = state.serverFunctions.size > 0;

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

          // make sure all server functions are exported
          if (hasServerFunction) {
            let exportDeclaration = t.exportNamedDeclaration(
              null,
              Array.from(state.serverFunctions).map((funcName) =>
                t.exportSpecifier(
                  t.identifier(funcName),
                  t.identifier(funcName),
                ),
              ),
            );
            path.pushContainer("body", exportDeclaration);
          }
        },
      },
    },

    post(file) {
      let serverFunctionsList = Array.from(this.serverFunctions);
      file.metadata = file.metadata || {};
      file.metadata = {
        serverFunctions: serverFunctionsList,
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

function getFunctionName(
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
) {
  let parent = path.parent;

  if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
    return parent.id.name;
  }

  if (t.isObjectProperty(parent) && t.isIdentifier(parent.key)) {
    return parent.key.name;
  }
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
