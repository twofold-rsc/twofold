import { expect, test } from "../test";

test("navigates to the image assets example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("Image assets", { exact: true }).click();

  await expect(page).toHaveURL("/build/images");
  await expect(
    page.getByRole("heading", { name: "Image imports" }),
  ).toBeVisible();
});

test("server-renders and hydrates image imports", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/build/images");

  await expect(page.getByText("RSC import", { exact: true })).toBeVisible();
  await expect(page.getByText("Client import", { exact: true })).toBeVisible();
  await expect(page.getByText("PNG import", { exact: true })).toBeVisible();
  await expect(page.getByText("SVG import", { exact: true })).toBeVisible();

  verifyNoErrors();
});

test("loads the RSC image import", async ({ page }) => {
  await page.goto("/build/images");

  let image = page.getByRole("img", { name: "Mountain" });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("loads the client image import", async ({ page }) => {
  await page.goto("/build/images");

  let image = page.getByRole("img", { name: "Grass" });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("loads the PNG image import", async ({ page }) => {
  await page.goto("/build/images");

  let image = page.getByRole("img", { name: "Drawing" });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("loads the SVG image import", async ({ page }) => {
  await page.goto("/build/images");

  let image = page.getByRole("img", { name: "Color" });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
});
