import { expect, test } from "../../test";

test.describe("API endpoint", () => {
  test("returns not found for an unexported method", async ({ request }) => {
    let response = await request.get("/http/api/empty");

    expect(response.status()).toBe(404);
    expect(await response.text()).toBe("Method not exported");
  });
});
