import { defineConfig } from "eslint/config";
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

export default defineConfig(
  {
    ignores: ["dist/"],
  },

  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginReactHooks.configs.flat["recommended-latest"],

  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  },

  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    plugins: {
      react: eslintPluginReact,
    },
  },
  {
    rules: {
      "prefer-const": "off",
      "no-unused-vars": "off",
      "no-unused-private-class-members": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
);
