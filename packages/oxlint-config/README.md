# @twofold/oxlint-config

Shared Oxlint configuration for Twofold applications.

## Usage

Install `@twofold/oxlint-config` and `oxlint`, then extend the shared config:

```ts
// oxlint.config.ts
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
});
```
