import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";

let DEBUG = false;

type Options = {
  moduleId: string;
};

type State = {
  moduleId: string;
  isClientModule: boolean;
  clientComponents: Set<string>;
};

export function TransformPlugin(
  babel: any,
  options: Options,
): PluginObj<State> {
  return {
    pre() {
      this.moduleId = options.moduleId;
      this.isClientModule = false;
      this.clientComponents = new Set();
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
              state.clientComponents.add(specifier.exported.name);
            } else if (t.isStringLiteral(specifier.exported)) {
              state.clientComponents.add(specifier.exported.value);
            }
          }
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        clientComponents: this.clientComponents,
      };
    },
  };
}

function hasUseClientDirective(program: t.Program | undefined) {
  if (!program || !program.directives) return false;
  return program.directives.some((directive) =>
    t.isDirectiveLiteral(directive.value, { value: "use client" }),
  );
}
