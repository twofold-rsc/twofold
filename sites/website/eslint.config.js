import { defineConfig } from "eslint/config";
import eslintPluginTwofold from "eslint-plugin-twofold";

export default defineConfig([
  eslintPluginTwofold.configs.recommended,
  {
    rules: {
      // your custom rules here...
      "prefer-const": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);
