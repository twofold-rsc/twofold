import { NodePath, PluginObject, PluginPass } from "@babel/core";
import * as t from "@babel/types";
import invariant from "tiny-invariant";
import { hasUseClientDirective } from "./utils.js";

type PluginState = {
  isClientModule: boolean;
};

export function CheckPlugin(): PluginObject {
  return {
    pre() {
      setState(this, "isClientModule", false);
    },

    visitor: {
      Program(path: NodePath<t.Program>, state) {
        if (hasUseClientDirective(path.node)) {
          setState(state, "isClientModule", true);
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        isClientModule: getState(this, "isClientModule"),
      };
    },
  };
}

function setState<K extends keyof PluginState>(
  state: PluginPass,
  key: K,
  value: PluginState[K],
): void {
  state.set(key, value);
}

function getState<K extends keyof PluginState>(
  state: PluginPass,
  key: K,
): PluginState[K] {
  let value = state.get(key) as PluginState[K] | undefined;
  invariant(value !== undefined, `CheckPlugin state \"${key}\" is missing`);
  return value as PluginState[K];
}
