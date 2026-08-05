import { type Page } from "@playwright/test";
import { expect, test } from "../test";

async function expectEncryptedCookie(page: Page, plaintext: string) {
  let cookie = (await page.context().cookies()).find(
    ({ name }) => name === "tfec_encrypted-cookie",
  );

  expect(cookie).toBeDefined();
  expect(cookie?.value).not.toContain(plaintext);
}

test("navigates to the encrypted cookies example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "HTTP" }).click();
  await page.getByText("Encrypted cookies", { exact: true }).click();

  await expect(page).toHaveURL("/http/encrypted-cookies");
  await expect(
    page.getByRole("heading", { name: "Encrypted cookies" }),
  ).toBeVisible();
});

test("server-renders and hydrates the encrypted cookies example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/http/encrypted-cookies");

  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Set to string" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("stores encrypted strings without exposing their plaintext", async ({
  page,
}) => {
  await page.goto("/http/encrypted-cookies");
  await page.getByRole("button", { name: "Set to string" }).click();

  await expect(page.getByText("String", { exact: true })).toBeVisible();
  await expect(page.getByText("A string", { exact: true })).toBeVisible();
  await expectEncryptedCookie(page, "A string");

  await page.reload();
  await expect(page.getByText("A string", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.goto("/http/encrypted-cookies");
  await expect(page.getByText("A string", { exact: true })).toBeVisible();
});

test("rejects tampered encrypted cookies", async ({ page }) => {
  await page.goto("/http/encrypted-cookies");
  await page.getByRole("button", { name: "Set to string" }).click();
  await expect(page.getByText("A string", { exact: true })).toBeVisible();

  let cookie = (await page.context().cookies()).find(
    ({ name }) => name === "tfec_encrypted-cookie",
  );
  if (!cookie) {
    throw new Error("Expected encrypted cookie to be set");
  }

  // change first char of encrypted cookie
  let tamperedValue = `${cookie.value[0] === "A" ? "B" : "A"}${cookie.value.slice(1)}`;
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: cookie.name,
      value: tamperedValue,
      url: page.url(),
    },
  ]);

  await expect
    .poll(
      async () =>
        (await page.context().cookies()).find(
          ({ name }) => name === "tfec_encrypted-cookie",
        )?.value,
    )
    .toBe(tamperedValue);

  await page.reload();
  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
});

test("stores encrypted objects without exposing their plaintext", async ({
  page,
}) => {
  await page.goto("/http/encrypted-cookies");

  await page.getByRole("button", { name: "Set to object" }).click();
  await expect(page.getByText("Object", { exact: true })).toBeVisible();
  await expect(page.getByText("id", { exact: true })).toBeVisible();
  await expect(page.getByText("123", { exact: true })).toBeVisible();
  await expect(page.getByText("name", { exact: true })).toBeVisible();
  await expect(page.getByText("Alice", { exact: true })).toBeVisible();
  await expect(page.getByText("createdAt", { exact: true })).toBeVisible();
  await expect(page.getByText(/^\d{1,2}\/\d{1,2}\/\d{4}$/)).toBeVisible();
  await expectEncryptedCookie(page, "Alice");

  await page.reload();
  await expect(page.getByText("Object", { exact: true })).toBeVisible();
  await expect(page.getByText("id", { exact: true })).toBeVisible();
  await expect(page.getByText("123", { exact: true })).toBeVisible();
  await expect(page.getByText("name", { exact: true })).toBeVisible();
  await expect(page.getByText("Alice", { exact: true })).toBeVisible();
  await expect(page.getByText("createdAt", { exact: true })).toBeVisible();
  await expect(page.getByText(/^\d{1,2}\/\d{1,2}\/\d{4}$/)).toBeVisible();
});

test("stores encrypted maps without exposing their plaintext", async ({
  page,
}) => {
  await page.goto("/http/encrypted-cookies");

  await page.getByRole("button", { name: "Set to map" }).click();
  await expect(page.getByText("Map", { exact: true })).toBeVisible();
  await expect(page.getByText("key1", { exact: true })).toBeVisible();
  await expect(page.getByText("value1", { exact: true })).toBeVisible();
  await expect(page.getByText("key2", { exact: true })).toBeVisible();
  await expect(page.getByText("value2", { exact: true })).toBeVisible();
  await expectEncryptedCookie(page, "value1");

  await page.reload();
  await expect(page.getByText("Map", { exact: true })).toBeVisible();
  await expect(page.getByText("key1", { exact: true })).toBeVisible();
  await expect(page.getByText("value1", { exact: true })).toBeVisible();
  await expect(page.getByText("key2", { exact: true })).toBeVisible();
  await expect(page.getByText("value2", { exact: true })).toBeVisible();
});

test("stores encrypted promises without exposing their plaintext", async ({
  page,
}) => {
  await page.goto("/http/encrypted-cookies");

  await page.getByRole("button", { name: "Set to promise" }).click();
  await expect(page.getByText("String", { exact: true })).toBeVisible();
  await expect(page.getByText("Resolved value", { exact: true })).toBeVisible();
  await expectEncryptedCookie(page, "Resolved value");

  await page.reload();
  await expect(page.getByText("String", { exact: true })).toBeVisible();
  await expect(page.getByText("Resolved value", { exact: true })).toBeVisible();
});

test("destroys encrypted cookies", async ({ page }) => {
  await page.goto("/http/encrypted-cookies");
  await page.getByRole("button", { name: "Set to string" }).click();
  await expect(page.getByText("A string", { exact: true })).toBeVisible();
  await expectEncryptedCookie(page, "A string");

  await page.getByRole("button", { name: "Destroy cookie" }).click();
  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
  expect(
    (await page.context().cookies()).some(
      ({ name }) => name === "tfec_encrypted-cookie",
    ),
  ).toBe(false);

  await page.reload();
  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
});

test("shows an error when trying to put a function in a cookie", async ({
  page,
}) => {
  await page.goto("/http/encrypted-cookies");
  await page.getByRole("button", { name: "Set to function" }).click();

  await expect(
    page.getByText(
      "You should get an error when trying to stringify a function.",
      { exact: true },
    ),
  ).toBeVisible();
});
