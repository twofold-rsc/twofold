import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";
import { hasUseClientDirective } from "./utils.js";

type State = {
  isClientModule: boolean;
};

export function CheckPlugin(): PluginObj<State> {
  return {
    pre() {
      this.isClientModule = false;
    },

    visitor: {
      Program(path: NodePath<t.Program>, state: State) {
        if (hasUseClientDirective(path.node)) {
          state.isClientModule = true;
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        isClientModule: this.isClientModule,
      };
    },
  };
}
