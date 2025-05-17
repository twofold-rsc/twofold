import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";
import { hasUseClientDirective } from "./utils.js";

type Options = {
  moduleId: string;
};

type State = {
  moduleId: string;
  isClientModule: boolean;
  clientExports: Set<string>;
};

export function TransformPlugin(
  babel: any,
  options: Options,
): PluginObj<State> {
  return {
    pre() {
      this.moduleId = options.moduleId;
      this.isClientModule = false;
      this.clientExports = new Set();
    },

    visitor: {
      Program: {
        enter(path: NodePath<t.Program>, state: State) {
          if (hasUseClientDirective(path.node)) {
            state.isClientModule = true;
          }
        },
      },

      ExportNamedDeclaration(path, state) {
        if (state.isClientModule) {
          let { specifiers } = path.node;

          for (let specifier of specifiers) {
            if (t.isIdentifier(specifier.exported)) {
              state.clientExports.add(specifier.exported.name);
            } else if (t.isStringLiteral(specifier.exported)) {
              state.clientExports.add(specifier.exported.value);
            }
          }
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        clientExports: this.clientExports,
      };
    },
  };
}
