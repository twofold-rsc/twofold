import { readFile, writeFile } from "node:fs/promises";

import { expect, test } from "../test";
import { disableBuildErrors, enableBuildErrors } from "./build-error-source";

test("shows RSC missing import errors after a rebuild", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-missing-import.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  await page.goto("/error-handling/rsc/rsc-missing-import");
  await expect(
    page.getByText("You shouldn't see this", { exact: true }),
  ).toBeVisible();

  try {
    await writeFile(fileUrl, brokenSource);

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "doesnt-exist",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(
      page.getByText("You shouldn't see this", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows RSC missing import errors on initial visit", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-missing-import.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  try {
    await writeFile(fileUrl, brokenSource);
    await page.goto("/error-handling/rsc/rsc-missing-import");

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "doesnt-exist",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(
      page.getByText("You shouldn't see this", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows RSC missing image errors after a rebuild", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-missing-image.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  await page.goto("/error-handling/rsc/rsc-missing-image");
  await expect(
    page.getByText("You shouldn't see this missing image", { exact: true }),
  ).toBeVisible();

  try {
    await writeFile(fileUrl, brokenSource);

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "missing.png",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(
      page.getByText("You shouldn't see this missing image", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows RSC missing image errors on initial visit", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-missing-image.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  try {
    await writeFile(fileUrl, brokenSource);
    await page.goto("/error-handling/rsc/rsc-missing-image");

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "missing.png",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(
      page.getByText("You shouldn't see this missing image", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows RSC syntax errors after a rebuild", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-syntax-error.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  await page.goto("/error-handling/rsc/rsc-syntax-error");
  await expect(page.getByText("1", { exact: true })).toBeVisible();

  try {
    await writeFile(fileUrl, brokenSource);

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "rsc-syntax-error",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(page.getByText("1", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows RSC syntax errors on initial visit", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-syntax-error.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  try {
    await writeFile(fileUrl, brokenSource);
    await page.goto("/error-handling/rsc/rsc-syntax-error");

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "rsc-syntax-error",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(page.getByText("1", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows a missing RSC page export after a rebuild", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-no-default-export.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  await page.goto("/error-handling/rsc/rsc-no-default-export");
  await expect(page.getByText("Oh no!", { exact: true })).toBeVisible();

  try {
    await writeFile(fileUrl, brokenSource);

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "has no default export",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(page.getByText("Oh no!", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows a missing RSC page export on initial visit", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-no-default-export.page.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  try {
    await writeFile(fileUrl, brokenSource);
    await page.goto("/error-handling/rsc/rsc-no-default-export");

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "has no default export",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(page.getByText("Oh no!", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows a missing RSC layout export after a rebuild", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-layout-no-default-export/layout.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  await page.goto("/error-handling/rsc/rsc-layout-no-default-export");
  await expect(page.getByText("Hello world", { exact: true })).toBeVisible();

  try {
    await writeFile(fileUrl, brokenSource);

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "has no default export",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(page.getByText("Hello world", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});

test("shows a missing RSC layout export on initial visit", async ({ page }) => {
  let fileUrl = new URL(
    "../../../app/pages/error-handling/rsc/rsc-layout-no-default-export/layout.tsx",
    import.meta.url,
  );
  let source = await readFile(fileUrl, "utf8");
  let brokenSource = enableBuildErrors(source);

  expect(brokenSource).not.toBe(source);
  expect(disableBuildErrors(brokenSource)).toBe(source);

  try {
    await writeFile(fileUrl, brokenSource);
    await page.goto("/error-handling/rsc/rsc-layout-no-default-export");

    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("error-message")).toContainText(
      "has no default export",
    );
  } finally {
    await writeFile(fileUrl, disableBuildErrors(brokenSource));
    await expect(page.getByText("Hello world", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("error-message")).not.toBeVisible();
  }
});
