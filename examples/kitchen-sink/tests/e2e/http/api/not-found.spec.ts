import { expect, test } from "../../test";

test.describe("API endpoint", () => {
  test("returns not found", async ({ request }) => {
    let response = await request.get("/http/api/not-found");
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe("Not found");
  });
});
