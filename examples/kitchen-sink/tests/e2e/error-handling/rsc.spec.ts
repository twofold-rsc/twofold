import { readFile, writeFile } from "node:fs/promises";

import { expect, test } from "../test";
import {
  disableBuildErrors,
  enableBuildErrors,
  waitForDevReloadConnection,
} from "./helpers";

test("shows an error when an RSC throws", async ({ page }, testInfo) => {
  await page.goto("/error-handling/rsc/rsc-throw");

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

test("shows an error when navigating to an RSC that throws", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/rsc");
  await page.getByRole("link", { name: "RSC throw", exact: true }).click();

  await expect(page).toHaveURL("/error-handling/rsc/rsc-throw");
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

test("shows an error when an async RSC throws", async ({ page }, testInfo) => {
  await page.goto("/error-handling/rsc/rsc-async-throw");

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

test("shows an error when navigating to an async RSC that throws", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/rsc");
  await page
    .getByRole("link", { name: "RSC async throw", exact: true })
    .click();

  await expect(page).toHaveURL("/error-handling/rsc/rsc-async-throw");
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

test("shows an error when an RSC promise rejects", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/rsc/rsc-async-reject");

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

test("shows an error when navigating to an RSC promise that rejects", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/rsc");
  await page
    .getByRole("link", { name: "RSC async reject", exact: true })
    .click();

  await expect(page).toHaveURL("/error-handling/rsc/rsc-async-reject");
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

test("shows an error when a suspended RSC throws", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/rsc/rsc-suspended-throw", {
    waitUntil: "commit",
  });

  await expect(page.getByTestId("suspense-fallback")).toBeVisible();
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

test("shows an error when navigating to a suspended RSC that throws", async ({
  page,
}, testInfo) => {
  await page.goto("/error-handling/rsc");
  await page
    .getByRole("link", { name: "RSC suspended throw", exact: true })
    .click();

  await expect(page.getByTestId("suspense-fallback")).toBeVisible();
  await expect(page).toHaveURL("/error-handling/rsc/rsc-suspended-throw");
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

// The timer throws outside the request promise, leaving the request pending and
// potentially terminating the shared development server instead of rendering UI.
// test.skip("shows an error when an RSC throws out of band", async ({
//   page,
// }) => {
//   await page.goto("/error-handling/rsc/rsc-async-oob-throw");
//
//   await expect(
//     page.getByRole("heading", { name: "Error", exact: true }),
//   ).toBeVisible();
//   await expect(page.getByTestId("error-message")).toContainText("Oh no!");
// });

// The timer throws outside the request promise, leaving navigation pending and
// potentially terminating the shared development server instead of rendering UI.
// test.skip("shows an error when navigating to an RSC that throws out of band", async ({
//   page,
// }) => {
//   await page.goto("/error-handling/rsc");
//   await page
//     .getByRole("link", { name: "RSC async out-of-band throw", exact: true })
//     .click();
//
//   await expect(
//     page.getByRole("heading", { name: "Error", exact: true }),
//   ).toBeVisible();
//   await expect(page.getByTestId("error-message")).toContainText("Oh no!");
// });

test(
  "shows RSC missing import errors after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
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
  },
);

test(
  "shows RSC missing import errors on initial visit",
  { tag: "@build" },
  async ({ page }) => {
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
      let devReloadConnected = waitForDevReloadConnection(page);
      await page.goto("/error-handling/rsc/rsc-missing-import");
      await devReloadConnected;

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
  },
);

test(
  "shows RSC missing image errors after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
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
  },
);

test(
  "shows RSC missing image errors on initial visit",
  { tag: "@build" },
  async ({ page }) => {
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
      let devReloadConnected = waitForDevReloadConnection(page);
      await page.goto("/error-handling/rsc/rsc-missing-image");
      await devReloadConnected;

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
  },
);

test(
  "shows RSC syntax errors after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
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
  },
);

test(
  "shows RSC syntax errors on initial visit",
  { tag: "@build" },
  async ({ page }) => {
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
      let devReloadConnected = waitForDevReloadConnection(page);
      await page.goto("/error-handling/rsc/rsc-syntax-error");
      await devReloadConnected;

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
  },
);

test(
  "shows a missing RSC page export after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
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
  },
);

test(
  "shows a missing RSC page export on initial visit",
  { tag: "@build" },
  async ({ page }) => {
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
      let devReloadConnected = waitForDevReloadConnection(page);
      await page.goto("/error-handling/rsc/rsc-no-default-export");
      await devReloadConnected;

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
  },
);

test(
  "shows a missing RSC layout export after a rebuild",
  { tag: "@build" },
  async ({ page }) => {
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
  },
);

test(
  "shows a missing RSC layout export on initial visit",
  { tag: "@build" },
  async ({ page }) => {
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
      let devReloadConnected = waitForDevReloadConnection(page);
      await page.goto("/error-handling/rsc/rsc-layout-no-default-export");
      await devReloadConnected;

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
  },
);
