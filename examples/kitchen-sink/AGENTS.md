## E2E Tests

For a targeted Kitchen Sink E2E spec, pass `--no-deps` so Playwright does not also run the `app-build` project:

```sh
pnpm exec playwright test --no-deps tests/e2e/routing/nested-layouts.spec.ts
```
