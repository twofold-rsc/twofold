import { expect, test } from "../../test";

test.describe("API endpoint", () => {
  test("returns an internal server error", async ({ request }) => {
    let response = await request.get("/http/api/errors");

    expect(response.status()).toBe(500);
  });
});
