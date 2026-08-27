# V2 Build Todo

## Static Output and Hattip Types

### Problem

`StaticFilesOutput.fileMap` is correctly typed as a `ReadonlyMap`. However, `createStaticMiddleware` requires a mutable `Map<string, ReadOnlyFile>`.

Passing the v2 output directly will fail to compile when integration happens.

### Solution

Convert the readonly map at the integration boundary:

```ts
new Map(output.fileMap);
```

This is a minor type mismatch, but it must be handled during integration.

## Static File Reader Source Root

### Problem

`StaticFilesBuilder` discovers files under `EntriesOutput.sourceRoot`, but the current runtime creates its file reader from `process.cwd()/public`. When the entries source root differs from the application root, the static metadata and file reader will point at different directories.

### Solution

Create the static file reader from the entries source root at the v2 runtime integration boundary:

```ts
createFileReader(new URL("./public/", entries.sourceRoot));
```

Use this reader with `StaticFilesOutput.fileMap`. The static output should remain metadata-only; `EntriesOutput` stays the single authority for the application source root.

## Production Error HTML Virtual Module

### Problem

`ProdErrorPage` reads `process.env.TWOFOLD_PROD_ERROR_HTML`, but this is not a runtime environment variable. `ClientBuilder` reads `ServerFilesOutput.errorHtmlPath` during the build and uses Rolldown's `define` option to replace the expression with the complete HTML string.

The browser needs the HTML embedded because it cannot access the generated filesystem path. Expressing that dependency as an environment variable is misleading and implicit.

### Solution

Replace the `define` with a virtual module such as `twofold:error-html`. `ProdErrorPage` should import the virtual module, and a narrowly scoped Rolldown plugin should:

1. Resolve the virtual module.
2. Read `ServerFilesOutput.errorHtmlPath`.
3. Return a JavaScript module that exports the HTML string.

Add the corresponding TypeScript module declaration. This keeps the generated server file as the canonical input, makes the dependency visible in the module graph, and preserves error rendering without a runtime network request.
