import { readFile, writeFile } from "node:fs/promises";

import { expect, test } from "../test";

test("navigates to the HMR example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("HMR", { exact: true }).click();

  await expect(page).toHaveURL("/build/hmr");
  await expect(page.getByRole("heading", { name: "HMR" })).toBeVisible();
});

test("renders HMR client components", async ({ page, verifyNoErrors }) => {
  await page.goto("/build/hmr");

  await expect(page.getByText("HMR A", { exact: true })).toBeVisible();
  await expect(page.getByText("HMR B", { exact: true })).toBeVisible();
  await expect(page.getByText("Shared component", { exact: true })).toHaveCount(
    2,
  );

  verifyNoErrors();
});

test("updates HMR A", async ({ page }) => {
  let hmrAUrl = new URL(
    "../../../app/pages/build/hmr/hmr-a.tsx",
    import.meta.url,
  );
  let source = await readFile(hmrAUrl, "utf8");
  let updatedContent = `Updated HMR A ${crypto.randomUUID()}`;

  await page.goto("/build/hmr");

  try {
    await writeFile(hmrAUrl, source.replace("HMR A", updatedContent));

    await expect(page.getByText(updatedContent, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("HMR B", { exact: true })).toBeVisible();
  } finally {
    await writeFile(hmrAUrl, source);
  }
});

test("updates HMR B", async ({ page }) => {
  let hmrBUrl = new URL(
    "../../../app/pages/build/hmr/hmr-b.tsx",
    import.meta.url,
  );
  let source = await readFile(hmrBUrl, "utf8");
  let updatedContent = `Updated HMR B ${crypto.randomUUID()}`;

  await page.goto("/build/hmr");

  try {
    await writeFile(hmrBUrl, source.replace("HMR B", updatedContent));

    await expect(page.getByText(updatedContent, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("HMR A", { exact: true })).toBeVisible();
  } finally {
    await writeFile(hmrBUrl, source);
  }
});

test("updates the shared HMR component in both places", async ({ page }) => {
  let sharedComponentUrl = new URL(
    "../../../app/pages/build/hmr/hmr-shared-test.tsx",
    import.meta.url,
  );
  let source = await readFile(sharedComponentUrl, "utf8");
  let updatedContent = `Updated shared component ${crypto.randomUUID()}`;

  await page.goto("/build/hmr");

  try {
    await writeFile(
      sharedComponentUrl,
      source.replace("Shared component", updatedContent),
    );

    await expect(page.getByText(updatedContent, { exact: true })).toHaveCount(
      2,
      {
        timeout: 15_000,
      },
    );
  } finally {
    await writeFile(sharedComponentUrl, source);
  }
});
