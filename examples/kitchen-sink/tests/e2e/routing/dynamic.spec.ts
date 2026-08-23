import { expect, test } from "../test";

test("navigates to the dynamic URLs example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Dynamic URLs" }).click();

  await expect(page).toHaveURL("/routing/dynamic");
  await expect(
    page.getByRole("heading", { name: "Dynamic URLs" }),
  ).toBeVisible();
});

test.describe("navigation", () => {
  test("routes home links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL("/routing/dynamic");
    await expect(
      page.getByText("Welcome to the dynamic routing page!"),
    ).toBeVisible();
  });

  test("routes slug ABC links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Slug ABC" }).click();
    await expect(page).toHaveURL("/routing/dynamic/ABC");
    await expect(page.getByText("{params.slug} is: ABC")).toBeVisible();
  });

  test("routes slug 123 links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Slug 123" }).click();
    await expect(page).toHaveURL("/routing/dynamic/123");
    await expect(page.getByText("{params.slug} is: 123")).toBeVisible();
  });

  test("routes fixed sibling links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Fixed sibling" }).click();
    await expect(page).toHaveURL("/routing/dynamic/fixed");
    await expect(
      page.getByText(/This is a fixed page that is a sibling/),
    ).toBeVisible();
  });

  test("routes catch-all links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Catch all", exact: true }).click();
    await expect(page).toHaveURL("/routing/dynamic/slug/doesnt-exist");
    await expect(
      page.getByText("Wildcard route!", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("{params.wildcard} is: slug/doesnt-exist"),
    ).toBeVisible();
  });

  test("routes dashed parameter links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Dashed parameter" }).click();
    await expect(page).toHaveURL("/routing/dynamic/dashed/hello-world");
    await expect(
      page.getByText('{params["a-slug"]} is: hello-world'),
    ).toBeVisible();
  });

  test("routes dashed catch-all links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Dashed catch all" }).click();
    await expect(page).toHaveURL("/routing/dynamic/dashed/one/two");
    await expect(
      page.getByText('{params["all-things"]} is: one/two'),
    ).toBeVisible();
  });

  test("routes nested folder/file links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page
      .getByRole("link", { name: "Nested folder/file", exact: true })
      .click();
    await expect(page).toHaveURL("/routing/dynamic/nested/folder/file");
    await expect(page.getByText("{params.folder} is: folder")).toBeVisible();
    await expect(page.getByText("{params.file} is: file")).toBeVisible();
  });

  test("routes nested folder/file2 links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Nested folder/file2" }).click();
    await expect(page).toHaveURL("/routing/dynamic/nested/folder/file2");
    await expect(page.getByText("{params.folder} is: folder")).toBeVisible();
    await expect(page.getByText("{params.file} is: file2")).toBeVisible();
  });

  test("routes nested fixed links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Nested fixed" }).click();
    await expect(page).toHaveURL("/routing/dynamic/nested/folder/fixed");
    await expect(
      page.getByText(/This is a fixed page that is a sibling/),
    ).toBeVisible();
  });

  test("routes deep catch-all links", async ({ page }) => {
    await page.goto("/routing/dynamic");

    await page.getByRole("link", { name: "Deep catch all" }).click();
    await expect(page).toHaveURL(
      "/routing/dynamic/nested/folder/file/doesnt-exist",
    );
    await expect(
      page.getByText("Nested wildcard route!", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("{params.wildcard} is: file/doesnt-exist"),
    ).toBeVisible();
  });
});

test.describe("direct access", () => {
  test("server-renders the index", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/dynamic");

    await expect(
      page.getByText("Welcome to the dynamic routing page!"),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders slug ABC", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/dynamic/ABC");

    await expect(page.getByText("{params.slug} is: ABC")).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders slug 123", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/dynamic/123");

    await expect(page.getByText("{params.slug} is: 123")).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the fixed sibling", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/dynamic/fixed");

    await expect(
      page.getByText(/This is a fixed page that is a sibling/),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the catch-all route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/slug/doesnt-exist");

    await expect(
      page.getByText("{params.wildcard} is: slug/doesnt-exist"),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the dashed parameter route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/dashed/hello-world");

    await expect(
      page.getByText('{params["a-slug"]} is: hello-world'),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the dashed catch-all route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/dashed/one/two");

    await expect(
      page.getByText('{params["all-things"]} is: one/two'),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders nested folder/file", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/nested/folder/file");

    await expect(page.getByText("{params.folder} is: folder")).toBeVisible();
    await expect(page.getByText("{params.file} is: file")).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders nested folder/file2", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/nested/folder/file2");

    await expect(page.getByText("{params.folder} is: folder")).toBeVisible();
    await expect(page.getByText("{params.file} is: file2")).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the nested fixed route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/nested/folder/fixed");

    await expect(
      page.getByText(/This is a fixed page that is a sibling/),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the deep catch-all route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/dynamic/nested/folder/file/doesnt-exist");

    await expect(
      page.getByText("{params.wildcard} is: file/doesnt-exist"),
    ).toBeVisible();
    verifyNoErrors();
  });
});
