import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginTwofold from "eslint-plugin-twofold";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginTwofold.configs.recommended,
  {
    rules: {
      // your custom rules here...
      "prefer-const": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
