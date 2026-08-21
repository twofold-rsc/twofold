import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "react"],
  categories: {
    correctness: "error",
  },
  env: {
    builtin: true,
    browser: true,
    node: true,
  },
  ignorePatterns: ["dist/"],
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: "warn",
  },
  rules: {
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-unused-private-class-members": "off",
    "typescript/no-unused-vars": "off",
    "typescript/no-this-alias": "off",
  },
});
