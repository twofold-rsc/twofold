import { NodePath, PluginObject, PluginPass } from "@babel/core";
import * as t from "@babel/types";
import invariant from "tiny-invariant";
import { hasUseClientDirective } from "./utils.js";

type PluginState = {
  moduleId: string;
  isClientModule: boolean;
  clientExports: Set<string>;
};

export function TransformPlugin(_babel: any, options: object): PluginObject {
  return {
    pre() {
      if (!("moduleId" in options) || typeof options.moduleId !== "string") {
        throw new Error(
          "TransformPlugin requires options.moduleId to be a string",
        );
      }

      setState(this, "moduleId", options.moduleId);
      setState(this, "isClientModule", false);
      setState(this, "clientExports", new Set());
    },

    visitor: {
      Program: {
        enter(path: NodePath<t.Program>, state) {
          if (hasUseClientDirective(path.node)) {
            setState(state, "isClientModule", true);
          }
        },
      },

      ExportNamedDeclaration(path, state) {
        if (getState(state, "isClientModule")) {
          let clientExports = getState(state, "clientExports");
          let { specifiers } = path.node;

          for (let specifier of specifiers) {
            if (t.isIdentifier(specifier.exported)) {
              clientExports.add(specifier.exported.name);
            } else if (t.isStringLiteral(specifier.exported)) {
              clientExports.add(specifier.exported.value);
            }
          }
        }
      },
    },

    post(file) {
      file.metadata = file.metadata || {};
      file.metadata = {
        clientExports: getState(this, "clientExports"),
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
  invariant(value !== undefined, `TransformPlugin state \"${key}\" is missing`);
  return value as PluginState[K];
}
