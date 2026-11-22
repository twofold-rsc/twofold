# Correct RSC error-template paths

**Status:** Proposed

## Problem

[`RSCBuilder`](../packages/framework/src/backend/build/builders/rsc-builder.ts) uses two different rules for root error templates: one to choose build inputs, and another to decide whether a compiled framework fallback is needed. Those rules can disagree, leaving the runtime looking for a fallback entry that was never compiled.

- The documented not-found override is [`app/pages/not-found.error.tsx`](<../sites/website/app/pages/(main)/docs/reference/not-found.md#customizing-the-not-found-page>). It already matches the `*.error.tsx` entry glob, but the explicit input check looks for `app/pages/errors/not-found.tsx` instead. That alternate file can suppress the framework fallback even though it is not registered as an app error template.
- `app/pages/unauthorized.error.tsx` is checked at the correct location. But registration records its template path as `/unauthorized`, while the fallback check looks for the `unauthorized` tag at path `/`. The builder can omit the framework fallback and then try to look it up anyway. The registration check has the same path mismatch for `/not-found`.

## Intended behavior

- `app/pages/not-found.error.tsx` and `app/pages/unauthorized.error.tsx` override the respective framework defaults at the root. Either override works independently.
- A missing root override uses its compiled framework default. An unrelated `app/pages/errors/not-found.tsx` does not affect that decision.
- Nested `*.error.tsx` templates still apply at the nearest matching boundary. Framework not-found and unauthorized **page** entries still serve their existing routes.

## Implementation

1. Define the two root overrides once, pairing each tag with its canonical app path and framework fallback. Keep the app overrides discoverable through the existing `*.error.tsx` glob. Use the shared definition to decide which framework fallback entries to compile.
2. In `RSCOutput`, decide whether to register each fallback using that same definition and the app override's compiled entry point. Remove the check that compares the full template path directly to `/`. Keep the existing template-path representation for organizing nested boundaries.
3. Add regression coverage for no overrides, each root override independently, and an alternate `app/pages/errors/not-found.tsx` without the canonical override. Verify the selected template renders for an unmatched route (404) or an unauthorized request (401), as appropriate. Run the existing nested not-found and unauthorized tests to check that nearest-boundary behavior still works.

Once the input rules are corrected, use them as the source of truth for the RSC root inventory in the [Entries Queue plan](entries-queue.md).
