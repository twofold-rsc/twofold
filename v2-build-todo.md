# V2 Build Todo

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

## Config should live in entries

Entries is the "source" for the build, and if we have different sources we could have different configs. In this case I think it makes sense to let entries load the config.

An added benefit is you can serialize the config and reload it. On top of that we get to drop the capture block.

This work is opaque and should be done after the v2 build system is in place.

## Runtime should run the global middleware

Right now all global middleware is handled by the middleware plugin, but this exposes knowledge of the buildResult. The plugin is useful, but it should delegate running the middleware to the runtime (like how we delegate rendering pages to the runtime)

## Build orchestration

- cli: dev, build, serve when we have an existing error
- some sort of build load validation when running serve

### Build changes

- Changes are currently calculated as part of completing a successful build. Consider making this calculation lazy if its cost becomes significant.
- Production one-shot calculates changes

## Runtime notes

- Runtime should get passed a build result and operate on that.
- Runtime owns the worker (like it does now)
- RuntimeHost? (seems bad) that coordinates live reloads as builds change?
