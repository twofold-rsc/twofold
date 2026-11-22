# Port the RSC builder to Rolldown

## Scope

Add `packages/framework/src/backend/build/builders/rsc-rolldown-builder.ts` with its own builder, output model, and RSC-specific plugins. Keep `rsc-builder.ts` intact until we’re ready to remove the esbuild implementation. Use existing framework primitives (`Builder`, `EntriesOutput`, directive transforms, route objects, and file helpers), but don’t extract or share implementation code between the RSC builders.

Wire the new builder into development and production by changing the `rsc` registration in the two build session classes. There’s no opt-in system: no environment variable, CLI flag, app config, or runtime builder selection. Reverting the wiring is the rollback while the old builder is still in the tree.

## Implementation

### 1. Establish the Rolldown build and output model

- Keep the `{ environment, entries }` input. Discover the same page, layout, API, and error-template files, and include optional middleware, discovered action entries, and framework entries. Deduplicate and sort inputs so that an unchanged build produces stable filenames.
- Produce split Node-targeted ESM with automatic JSX, `react-server` / `module` resolution, and the configured externals. Match esbuild’s package/subpath external behavior and keep framework `rsc-store` imports pointed at the compiled singleton. Treat unresolved imports as build errors.
- Build a serializable output model from Rolldown’s output: source entry to emitted JS file, route entry to emitted stylesheet, asset maps, and the emitted file list. Use that model to expose the existing route lookup, middleware, action manifest, asset, and `warm()` behavior. Generated filenames and the serialized shape can change; don’t recreate the esbuild metafile.

### 2. Prove action exports and route CSS before wiring the sessions

- **Directives and actions:** Port the client proxy and server action hooks using the existing transforms. Preserve module and action IDs so the client and RSC builds agree, along with the current encryption and transform exclusions. Map each action to an importable chunk that actually exports the recorded name. Prefer the explicit action entry when it exposes the export; verify inline and file-level actions, including when their module is also reachable from a route. Don’t assume the first chunk containing a source module exports its actions.
- **CSS and assets:** Use a Rolldown-local Tailwind integration with the existing app scan base and production minification. Verify how the pinned Rolldown version exposes CSS dependencies, including styles reached through shared modules. Emit and record the CSS associated with each page and layout, preserving import order and route scoping. Keep the `rsc/css/` output directory so `AssetsBuilder` can continue publishing `styles/*`. Port image imports and `.woff2` imports, including relative and public-directory font URLs in CSS, preserving their hashed public URLs and MIME types.
- **First checkpoint:** Use a small fixture or focused Kitchen Sink case with a styled page and layout, a client reference, and a callable server action. Confirm the emitted action exports and the actual styles delivered to the page before moving on to the full suite.

### 3. Wire the replacement and check runtime parity

- Register the new builder under `rsc` in `DevelopmentBuildSession` and `ProductionBuildSession`. Update the registry and direct output type references in `AssetsBuilder` and build-change calculation to point at the new types. Keep the rest of the pipeline on the existing `rsc` output slot.
- Preserve custom and default not-found/unauthorized templates, catch boundaries, and the requirement that app error templates be client components. Keep build diagnostics actionable for missing imports, invalid syntax, and invalid error templates.
- Verify `serialize()` → `load()` → `warm()` through a production build followed by `serve` in a fresh process. If the serialized shape changes, bump the build artifact version so stale builds fail at load with a clear rebuild instruction. Rollback also requires a fresh build.
- Keep previously emitted RSC chunks on disk during development rebuilds. Verify that a no-op rebuild keeps hashes stable, that a real edit produces the expected build changes, and that a failed rebuild doesn’t delete files used by the last successful build.

## Verification and completion

- In `packages/framework`, run `pnpm compile`, `pnpm lint`, and `pnpm test`. Add focused regression coverage where the existing tests don’t check the action export, CSS association, or artifact round trip.
- In `examples/kitchen-sink`, run `pnpm lint`, `pnpm exec playwright test`, and `pnpm exec playwright test --config playwright.production.config.ts` against fresh servers. For targeted dev specs, use `--no-deps`. Check server actions, client navigation, nested layouts, middleware, API routes, error handling, styles, fonts, images, and dev rebuild recovery.
- This migration is complete when both sessions use Rolldown and the checks pass. Removing the esbuild RSC builder is a follow-up once we’re satisfied with the replacement.
