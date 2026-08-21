import twofold from "@twofold/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [twofold],
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: [".twofold/"],
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: "warn",
  },
  rules: {
    "no-unused-vars": "off",
  },
});
