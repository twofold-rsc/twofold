import { NodePath, PluginObject, PluginPass } from "@babel/core";
import * as t from "@babel/types";

type State = {
  isServerModule: boolean;
};

export function CheckPlugin(): PluginObject {
  return {
    pre() {
      setState(this, "isServerModule", false);
    },

    visitor: {
      FunctionDeclaration(path, state) {
        if (hasUseServerDirective(path.node.body)) {
          setState(state, "isServerModule", true);
        }
      },

      FunctionExpression(path, state) {
        if (hasUseServerDirective(path.node.body)) {
          setState(state, "isServerModule", true);
        }
      },

      ArrowFunctionExpression(path, state) {
        if (
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          setState(state, "isServerModule", true);
        }
      },

      ObjectMethod(path, state) {
        if (
          t.isIdentifier(path.node.key) &&
          t.isBlockStatement(path.node.body) &&
          hasUseServerDirective(path.node.body)
        ) {
          setState(state, "isServerModule", true);
        }
      },

      Program(path: NodePath<t.Program>, state) {
        if (hasUseServerDirective(path.node)) {
          setState(state, "isServerModule", true);
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        isServerModule: getState(this, "isServerModule"),
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
    throw new Error(`CheckPlugin state "${key}" is missing`);
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
