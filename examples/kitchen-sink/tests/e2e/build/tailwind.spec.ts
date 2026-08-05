import { expect, test } from "../test";

test("navigates to the Tailwind example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("Tailwind", { exact: true }).click();

  await expect(page).toHaveURL("/build/tailwind");
  await expect(page.getByRole("heading", { name: "Tailwind" })).toBeVisible();
});

test("compiles the custom Tailwind theme", async ({ page, verifyNoErrors }) => {
  await page.goto("/build/tailwind");

  let message = page.getByText(
    "We compiled Tailwind correctly if this is blue.",
  );
  await expect(message).toBeVisible();
  await expect(message).toHaveCSS("color", "oklch(0.623 0.214 259.815)");

  verifyNoErrors();
});
