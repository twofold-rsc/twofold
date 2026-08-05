import { expect, test } from "../../test";

test.describe("page", () => {
  test("creates a cookie", async ({ page }) => {
    await page.goto("/http/api/cookies");

    await page.getByPlaceholder("Cookie value").fill("page-cookie");
    await page.getByRole("button", { name: "Update" }).click();

    await expect
      .poll(
        async () =>
          (await page.context().cookies()).find(
            ({ name }) => name === "api-cookie",
          )?.value,
      )
      .toBe("page-cookie");
  });

  test("reads a cookie", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "api-cookie",
        value: "page-cookie",
        url: "http://127.0.0.1:3000",
      },
    ]);

    await page.goto("/http/api/cookies");
    let input = page.getByPlaceholder("Cookie value");
    await page.getByRole("button", { name: "Fetch" }).click();

    await expect(input).toHaveValue("page-cookie");
  });

  test("destroys a cookie", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "api-cookie",
        value: "page-cookie",
        url: "http://127.0.0.1:3000",
      },
    ]);

    await page.goto("/http/api/cookies");
    let input = page.getByPlaceholder("Cookie value");
    await page.getByRole("button", { name: "Destroy" }).click();

    await expect(input).toHaveValue("");
    await expect
      .poll(async () =>
        (await page.context().cookies()).some(
          ({ name }) => name === "api-cookie",
        ),
      )
      .toBe(false);

    await page.getByRole("button", { name: "Fetch" }).click();
    await expect(input).toHaveValue("");
  });
});

test.describe("API endpoint", () => {
  test("creates a cookie", async ({ request }) => {
    let created = await request.post("/http/api/cookies", {
      multipart: { value: "endpoint-cookie" },
    });

    expect(created.status()).toBe(201);
    expect(created.headers()["set-cookie"]).toContain(
      "api-cookie=endpoint-cookie",
    );
  });

  test("reads a cookie", async ({ request }) => {
    let read = await request.get("/http/api/cookies", {
      headers: { cookie: "api-cookie=endpoint-cookie" },
    });

    expect(await read.json()).toEqual({ value: "endpoint-cookie" });
  });

  test("destroys a cookie", async ({ request }) => {
    let destroyed = await request.delete("/http/api/cookies", {
      headers: { cookie: "api-cookie=endpoint-cookie" },
    });

    expect(destroyed.status()).toBe(204);
    expect(destroyed.headers()["set-cookie"]).toContain("api-cookie=;");
    expect(destroyed.headers()["set-cookie"]).toContain("Max-Age=0");
  });
});
