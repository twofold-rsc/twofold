import { readFile, writeFile } from "node:fs/promises";

import { expect, test } from "../test";
import { disableBuildErrors, enableBuildErrors } from "./helpers";

test("renders feedback when a client component throws", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/client-components/cc-throws-in-browser");

  if (testInfo.project.metadata.environment === "production") {
    await expect(
      page.getByRole("heading", { name: "Application error", exact: true }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("error-message")).toContainText("Oh no!");
  }
});

test("renders feedback when navigating to a throwing client component", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/client-components");
  await page
    .getByRole("link", { name: "Client browser error", exact: true })
    .click();

  await expect(page).toHaveURL(
    "/error-handling/client-components/cc-throws-in-browser",
  );
  if (testInfo.project.metadata.environment === "production") {
    await expect(
      page.getByRole("heading", { name: "Application error", exact: true }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: "Error", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("error-message")).toContainText("Oh no!");
  }
});

test(
  "shows client component import errors after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
    let fileUrl = new URL(
      "../../../app/pages/error-handling/client-components/cc-import-error.tsx",
      import.meta.url,
    );
    let source = await readFile(fileUrl, "utf8");
    let brokenSource = enableBuildErrors(source);

    expect(brokenSource).not.toBe(source);
    expect(disableBuildErrors(brokenSource)).toBe(source);

    await page.goto("/error-handling/client-components/cc-import-error");
    await expect(
      page.getByText("Client import error", { exact: true }),
    ).toBeVisible();

    try {
      await writeFile(fileUrl, brokenSource);

      await expect(
        page.getByRole("heading", { name: "Error", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).toContainText(
        "this-module-doesnt-exist",
      );
    } finally {
      await writeFile(fileUrl, disableBuildErrors(brokenSource));
      await expect(
        page.getByText("Client import error", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).not.toBeVisible();
    }
  },
);

test(
  "shows client component import errors on initial visit",
  { tag: "@build" },
  async ({ page }) => {
    let fileUrl = new URL(
      "../../../app/pages/error-handling/client-components/cc-import-error.tsx",
      import.meta.url,
    );
    let source = await readFile(fileUrl, "utf8");
    let brokenSource = enableBuildErrors(source);

    expect(brokenSource).not.toBe(source);
    expect(disableBuildErrors(brokenSource)).toBe(source);

    try {
      await writeFile(fileUrl, brokenSource);
      await page.goto("/error-handling/client-components/cc-import-error");

      await expect(
        page.getByRole("heading", { name: "Error", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).toContainText(
        "this-module-doesnt-exist",
      );
    } finally {
      await writeFile(fileUrl, disableBuildErrors(brokenSource));
      await expect(
        page.getByText("Client import error", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).not.toBeVisible();
    }
  },
);

test(
  "shows client component syntax errors after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
    let fileUrl = new URL(
      "../../../app/pages/error-handling/client-components/cc-syntax-error.tsx",
      import.meta.url,
    );
    let source = await readFile(fileUrl, "utf8");
    let brokenSource = enableBuildErrors(source);

    expect(brokenSource).not.toBe(source);
    expect(disableBuildErrors(brokenSource)).toBe(source);

    await page.goto("/error-handling/client-components/cc-syntax-error");
    await expect(
      page.getByText("Client syntax error", { exact: true }),
    ).toBeVisible();

    try {
      await writeFile(fileUrl, brokenSource);

      await expect(
        page.getByRole("heading", { name: "Error", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).toContainText(
        "cc-syntax-error",
      );
    } finally {
      await writeFile(fileUrl, disableBuildErrors(brokenSource));
      await expect(
        page.getByText("Client syntax error", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).not.toBeVisible();
    }
  },
);

test(
  "shows client component syntax errors on initial visit",
  { tag: "@build" },
  async ({ page }) => {
    let fileUrl = new URL(
      "../../../app/pages/error-handling/client-components/cc-syntax-error.tsx",
      import.meta.url,
    );
    let source = await readFile(fileUrl, "utf8");
    let brokenSource = enableBuildErrors(source);

    expect(brokenSource).not.toBe(source);
    expect(disableBuildErrors(brokenSource)).toBe(source);

    try {
      await writeFile(fileUrl, brokenSource);
      await page.goto("/error-handling/client-components/cc-syntax-error");

      await expect(
        page.getByRole("heading", { name: "Error", exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).toContainText(
        "cc-syntax-error",
      );
    } finally {
      await writeFile(fileUrl, disableBuildErrors(brokenSource));
      await expect(
        page.getByText("Client syntax error", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("error-message")).not.toBeVisible();
    }
  },
);
