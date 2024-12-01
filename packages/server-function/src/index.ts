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

            if (capturedVariables.length > 0) {
              let binding = t.variableDeclaration("const", [
                t.variableDeclarator(
                  t.identifier(`${functionName}$binding`),
                  t.callExpression(
                    t.memberExpression(
                      t.identifier(functionName),
                      t.identifier("bind"),
                    ),
                    [
                      t.nullLiteral(),
                      ...capturedVariables.map((varName) =>
                        t.identifier(varName),
                      ),
                    ],
                  ),
                ),
              ]);

              let assignToBinding = t.variableDeclaration("const", [
                t.variableDeclarator(
                  t.identifier(name),
                  t.identifier(`${functionName}$binding`),
                ),
              ]);

              path.replaceWithMultiple([binding, assignToBinding]);
            } else {
              let assignToServerFunction = t.variableDeclaration("const", [
                t.variableDeclarator(
                  t.identifier(name),
                  t.identifier(functionName),
                ),
              ]);

              path.replaceWith(assignToServerFunction);
            }

            state.serverFunctions.add(functionName);
          }
        }
      },
      FunctionExpression(path: NodePath<t.FunctionExpression>, state: State) {
        // function expressions that are assigned to a variable
        if (
          t.isVariableDeclarator(path.parent) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let functionName = state.getUniqueFunctionName();
          let functionDeclaration = t.functionDeclaration(
            t.identifier(functionName),
            path.node.params,
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

          path.replaceWith(t.identifier(functionName));

          state.serverFunctions.add(functionName);
        }
      },
      ArrowFunctionExpression(
        path: NodePath<t.ArrowFunctionExpression>,
        state: State,
      ) {
        // block arrow functions that are assigned to a variable
        if (
          t.isVariableDeclarator(path.parent) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          let functionName = state.getUniqueFunctionName();
          let functionDeclaration = t.functionDeclaration(
            t.identifier(functionName),
            path.node.params,
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

          path.replaceWith(t.identifier(functionName));

          state.serverFunctions.add(functionName);
        }
      },
      ObjectProperty(path: NodePath<t.ObjectProperty>, state: State) {
        let { value } = path.node;

        // block arrow functions that are assigned to an object property
        if (
          t.isArrowFunctionExpression(value) &&
          t.isBlockStatement(value.body) &&
          hasUseServerDirective(value.body)
        ) {
          let functionName = state.getUniqueFunctionName();
          let functionDeclaration = t.functionDeclaration(
            t.identifier(functionName),
            value.params,
            value.body,
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
          path.node.value = t.identifier(functionName);

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

function hoistFunctionToModuleScope(path: NodePath<t.FunctionDeclaration>) {
  let parentPath = path.parentPath;
  let topFunction = path.findParent((p) => p.parentPath?.isProgram() ?? false);

  if (!topFunction) {
    return path;
  }

  let programPath = topFunction?.parentPath;
  if (!programPath || !programPath.isProgram() || programPath === parentPath) {
    return path;
  }

  let siblings = programPath.get("body");
  let topFunctionIndex = siblings.findIndex(
    (sibling) => sibling.node === topFunction.node,
  );

  if (topFunctionIndex === -1) {
    return path;
  }

  let hoistedFunction = t.cloneNode(path.node, true);
  let [newPath] = siblings[topFunctionIndex].insertBefore(hoistedFunction);

  path.remove();

  return newPath;
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

function findProgramPath(path: NodePath) {
  let underProgramPath = findParentUnderProgram(path);
  let programPath = underProgramPath?.parentPath;
  return programPath;
}

function hoistFunctionDeclarationToModuleScope(
  path: NodePath<t.FunctionExpression> | NodePath<t.ArrowFunctionExpression>,
) {
  let parentPath = path.parentPath;
  let topFunction = path.findParent((p) => p.parentPath?.isProgram() ?? false);

  if (!topFunction) {
    return path;
  }

  let programPath = topFunction?.parentPath;
  if (!programPath || !programPath.isProgram() || programPath === parentPath) {
    return path;
  }

  let siblings = programPath.get("body");
  let topFunctionIndex = siblings.findIndex(
    (sibling) => sibling.node === topFunction.node,
  );

  if (topFunctionIndex === -1) {
    return path;
  }

  // find the variable declaration for the path
  let declaratorPath = path.findParent(
    (p) => t.isVariableDeclarator(p.node) || t.isAssignmentExpression(p.node),
  );

  // this is probably too aggressive because it looks for
  // let x =, or const x =, but ignores x =
  let declaratorParentPath = declaratorPath?.parentPath;
  if (!t.isVariableDeclaration(declaratorParentPath?.node)) {
    return path;
  }

  let hoistedFunctionDeclaration = t.cloneNode(declaratorParentPath.node, true);
  let [newPath] = siblings[topFunctionIndex].insertBefore(
    hoistedFunctionDeclaration,
  );

  declaratorParentPath.remove();

  return newPath;
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

function insertRegisterServerReferenceAfterVariableDeclaration(
  path: NodePath,
  functionName: string,
  moduleId: string,
) {
  let parentPath = path.findParent(
    (p) => t.isVariableDeclarator(p.node) || t.isAssignmentExpression(p.node),
  );

  if (
    parentPath?.parentPath &&
    t.isVariableDeclaration(parentPath.parentPath.node)
  ) {
    parentPath.parentPath.insertAfter(
      t.expressionStatement(
        t.callExpression(t.identifier("registerServerReference"), [
          t.identifier(functionName),
          t.stringLiteral(moduleId),
          t.stringLiteral(functionName),
        ]),
      ),
    );
  }
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

function getCapturedVariables(path: NodePath<t.FunctionDeclaration>): string[] {
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

function transformFunctionWithCapturedVariables(
  path: NodePath<t.FunctionDeclaration>,
  functionName: string,
  capturedVars: string[],
) {
  if (capturedVars.length === 0) {
    return;
  }

  // add captured variables as params
  let params = path.node.params.map((param) => t.cloneNode(param));
  let newParams = [
    ...capturedVars.map((varName) => t.identifier(varName)),
    ...params,
  ];
  path.node.params = newParams;

  // insert .bind calls for all the captured variables
  // let bindCall = t.expressionStatement(
  //   t.callExpression(
  //     t.memberExpression(t.identifier(functionName), t.identifier("bind")),
  //     [
  //       t.nullLiteral(),
  //       ...capturedVars.map((varName) => t.identifier(varName)), // Pass captured variables to bind
  //     ],
  //   ),
  // );
  // path.insertAfter(bindCall);
}
