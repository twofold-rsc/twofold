import { readFile, writeFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

import { expect, test } from "../test";

test("navigates to the dev reload example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("Dev reload", { exact: true }).click();

  await expect(page).toHaveURL("/build/dev-reload");
  await expect(page.getByRole("heading", { name: "Dev reload" })).toBeVisible();
});

test("renders server, client, and markdown content", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/build/dev-reload");

  await expect(
    page.getByText("Server component", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Client component", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Markdown", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "This is a test" }),
  ).toBeVisible();

  verifyNoErrors();
});

test(
  "reloads when the server component changes",
  { tag: "@build" },
  async ({ page }) => {
    let serverComponentUrl = new URL(
      "../../../app/pages/build/dev-reload/server-component.tsx",
      import.meta.url,
    );
    let source = await readFile(serverComponentUrl, "utf8");

    let initialContent =
      "This page is a server component and editing it causes the RSC to re-render.";
    let updatedContent = `Updated server component content ${crypto.randomUUID()}`;

    await page.goto("/build/dev-reload");

    await expect(page.getByTestId("updatable-content")).toHaveText(
      initialContent,
    );

    try {
      await writeFile(
        serverComponentUrl,
        source.replace(
          /This page is a server component and editing it causes the RSC to\s+re-render\./,
          updatedContent,
        ),
      );

      await expect(page.getByTestId("updatable-content")).toHaveText(
        updatedContent,
        { timeout: 15_000 },
      );
    } finally {
      await writeFile(serverComponentUrl, source);
    }
  },
);

test(
  "reloads when the client component changes",
  { tag: "@build" },
  async ({ page }) => {
    let clientComponentUrl = new URL(
      "../../../app/pages/build/dev-reload/client-component.tsx",
      import.meta.url,
    );
    let source = await readFile(clientComponentUrl, "utf8");

    await page.goto("/build/dev-reload");

    await expect(page.getByTestId("updatable-button-label")).toHaveText("+");

    try {
      await writeFile(
        clientComponentUrl,
        source.replace(
          'data-testid="updatable-button-label">+',
          'data-testid="updatable-button-label">ADD 1',
        ),
      );

      await expect(page.getByTestId("updatable-button-label")).toHaveText(
        "ADD 1",
        { timeout: 15_000 },
      );
    } finally {
      await writeFile(clientComponentUrl, source);
    }
  },
);

test(
  "reloads when the markdown file changes",
  { tag: "@build" },
  async ({ page }) => {
    let markdownUrl = new URL(
      "../../../app/pages/build/dev-reload/markdown.md",
      import.meta.url,
    );
    let source = await readFile(markdownUrl, "utf8");
    let updatedContent = `Updated markdown content ${crypto.randomUUID()}`;

    await page.goto("/build/dev-reload");

    try {
      await writeFile(markdownUrl, `${source}\n\n${updatedContent}\n`);

      await expect(page.getByText(updatedContent, { exact: true })).toBeVisible(
        {
          timeout: 15_000,
        },
      );
    } finally {
      await writeFile(markdownUrl, source);
    }
  },
);

test(
  "reloads a hidden page when it becomes visible",
  { tag: "@build" },
  async ({ context, page }) => {
    let serverComponentUrl = new URL(
      "../../../app/pages/build/dev-reload/server-component.tsx",
      import.meta.url,
    );
    let source = await readFile(serverComponentUrl, "utf8");
    let initialContent =
      "This page is a server component and editing it causes the RSC to re-render.";
    let updatedContent = `Updated hidden page content ${crypto.randomUUID()}`;
    let pages = [page];

    try {
      await page.goto("/build/dev-reload");

      for (let i = 0; i < 3; i++) {
        let extraPage = await context.newPage();
        pages.push(extraPage);
        await extraPage.goto("/build/dev-reload");
        await extraPage.waitForFunction(
          () => window.__twofold?.clientAppIsInteractive === true,
        );
      }

      let hiddenPage = pages[3];
      if (!hiddenPage) {
        throw new Error("Expected a fourth page");
      }

      await setPageVisibility(hiddenPage, "hidden");
      await hiddenPage.waitForTimeout(3_500);

      await writeFile(
        serverComponentUrl,
        source.replace(
          /This page is a server component and editing it causes the RSC to\s+re-render\./,
          updatedContent,
        ),
      );

      await Promise.all(
        pages
          .slice(0, 3)
          .map((visiblePage) =>
            expect(visiblePage.getByTestId("updatable-content")).toHaveText(
              updatedContent,
              { timeout: 15_000 },
            ),
          ),
      );

      await hiddenPage.waitForTimeout(500);
      await expect(hiddenPage.getByTestId("updatable-content")).toHaveText(
        initialContent,
      );

      await setPageVisibility(hiddenPage, "visible");
      await expect(hiddenPage.getByTestId("updatable-content")).toHaveText(
        updatedContent,
        { timeout: 15_000 },
      );
    } finally {
      await writeFile(serverComponentUrl, source);
      await Promise.all(pages.slice(1).map((extraPage) => extraPage.close()));
    }
  },
);

async function setPageVisibility(
  page: Page,
  visibilityState: DocumentVisibilityState,
) {
  await page.evaluate((state) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => state,
    });

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => state === "hidden",
    });

    document.dispatchEvent(new Event("visibilitychange"));
  }, visibilityState);
}
