import { expect, test } from "../../test";

test.describe("API endpoint", () => {
  test("returns not found for a missing handler", async ({ request }) => {
    let response = await request.get("/http/api/missing-handler");

    expect(response.status()).toBe(404);
  });
});
