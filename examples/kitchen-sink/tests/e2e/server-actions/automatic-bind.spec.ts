import { expect, test } from "../test";

test("navigates to the automatic binding example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Automatic binding", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/automatic-bind");
  await expect(
    page.getByRole("heading", { name: "Server action automatic binding" }),
  ).toBeVisible();
});

test("server-renders and hydrates the automatic binding example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/automatic-bind");

  await expect(page.getByRole("button", { name: "Run one" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run two" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run three" })).toBeVisible();

  verifyNoErrors();
});

test("increments the automatically bound counter", async ({ page }) => {
  await page.goto("/server-actions/automatic-bind");

  let counter = page.getByTestId("counter-one");
  let initialCount = Number(await counter.textContent());
  await page.getByRole("button", { name: "Run one" }).click();

  await expect(counter).toHaveText(String(initialCount + 1));
});

test("runs one once, two twice, and three three times", async ({ page }) => {
  await page.goto("/server-actions/automatic-bind");

  let one = page.getByTestId("counter-one");
  let two = page.getByTestId("counter-two");
  let three = page.getByTestId("counter-three");
  let initialOne = Number(await one.textContent());
  let initialTwo = Number(await two.textContent());
  let initialThree = Number(await three.textContent());

  await page.getByRole("button", { name: "Run one" }).click();
  await page.getByRole("button", { name: "Run two" }).click();
  await page.getByRole("button", { name: "Run two" }).click();
  await page.getByRole("button", { name: "Run three" }).click();
  await page.getByRole("button", { name: "Run three" }).click();
  await page.getByRole("button", { name: "Run three" }).click();

  await expect(one).toHaveText(String(initialOne + 1));
  await expect(two).toHaveText(String(initialTwo + 2));
  await expect(three).toHaveText(String(initialThree + 3));
});
