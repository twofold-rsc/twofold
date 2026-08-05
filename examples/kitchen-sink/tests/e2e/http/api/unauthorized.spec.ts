import { expect, test } from "../../test";

test.describe("API endpoint", () => {
  test("returns unauthorized", async ({ request }) => {
    let response = await request.get("/http/api/unauthorized");
    expect(response.status()).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });
});
