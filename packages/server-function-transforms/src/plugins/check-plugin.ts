import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";

type State = {
  isServerModule: boolean;
};

export function CheckPlugin(): PluginObj<State> {
  return {
    pre() {
      this.isServerModule = false;
    },

    visitor: {
      FunctionDeclaration(path, state) {
        if (hasUseServerDirective(path.node.body)) {
          state.isServerModule = true;
        }
      },

      FunctionExpression(path, state) {
        if (hasUseServerDirective(path.node.body)) {
          state.isServerModule = true;
        }
      },

      ArrowFunctionExpression(path, state) {
        if (
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          state.isServerModule = true;
        }
      },

      ObjectMethod(path, state) {
        if (
          t.isIdentifier(path.node.key) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          state.isServerModule = true;
        }
      },

      Program(path: NodePath<t.Program>, state: State) {
        if (hasUseServerDirective(path.node)) {
          state.isServerModule = true;
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        isServerModule: this.isServerModule,
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
