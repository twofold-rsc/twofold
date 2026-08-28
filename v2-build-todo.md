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

## Reload Notification Timing

### Problem

The v2 build emits its completion event as soon as the build result and its changes are ready. V2 is not integrated with live reload yet, so this does not currently notify the browser.

During integration, the development lifecycle will stop the runtime, run the build, and then start the runtime again. If the build completion event is forwarded directly to live-reload consumers, the browser could receive it before the restarted runtime is ready. The browser may then request updated RSC data or assets that the runtime cannot serve yet.

### Integration Requirement

Keep the build completion event scoped to build completion. The development orchestrator should notify live-reload consumers only after both the build has completed and the runtime is ready to serve the new result.

## Build orchestration

### Persistence

- Add versioned aggregate serialization.
- Add save() for successful builds.
- Add load() using each registered builder’s load() method.
- Add warm() across loaded outputs.
- Decide whether partial errored builds can ever be serialized. Probably not.
- Reject old build JSON rather than accidentally loading it as v2.

### Lifecycle

- During runtime integration, pass the environment explicitly and keep reload capability in the runtime/server layer.
- Add any cleanup only if future builders acquire persistent resources. Current one-shot v2 builders do not need the old stop() lifecycle.

### Configuration

- Eventually extract the duplicated runtime config schema into a neutral module shared by old and v2 builds.
- Keep the exported Config type and runtime schema aligned.
- Decide how configuration cache invalidation should work during development. The old system clears it during setup, not each rebuild.

### Build changes

- Changes are currently calculated as part of completing a successful build. Consider making this calculation lazy if its cost becomes significant.
- Production one-shot calculates changes
