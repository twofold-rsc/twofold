# Application config

Twofold applications are configured using the `config/application.ts` file.

## Usage

The configuration file exports an object that specifies the settings for your application.

```tsx
// config/application.ts

import { Config } from "@twofold/framework/types";

let config: Config = {
  // default configuration
  externalPackages: [],
  reactCompiler: false,
  trustProxy: false,
};

export default config;
```

All configuration options are optional. Twofold attempts to provide sensible defaults for most settings, so you only need to specify the settings that you want to change.

## Options

### `externalPackages`

An array of package names that should be excluded from the build process.

Defaults to `[]`.

Twofold attempts to bundle dependencies by default, but some dependencies are designed to not be bundled. The build process does a pretty good job at automatically detecting packages that cannot be bundled, but you can use the `externalPackages` option to have more control over dependencies that should be excluded.

```tsx
let config: Config = {
  // exclude "a-node-library" from the build
  externalPackages: ["a-node-library"],
};
```

### `reactCompiler`

A boolean that determines whether to use the React Compiler.

Defaults to `false`.

When enabled Twofold will use the React Compiler to optimize your application's React code.

```tsx
let config: Config = {
  // turn on the React Compiler
  reactCompiler: true,
};
```

### `trustProxy`

A boolean that determines whether to trust `X-Forwarded` headers.

Defaults to `false`.

When enabled Twofold will use the `X-Forwarded` headers from the request object. This option should be set to `true` if you are running Twofold behind a proxy, load balancer, or CDN.

```tsx
let config: Config = {
  // trust X-Forwarded headers
  trustProxy: true,
};
```
