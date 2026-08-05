import { expect, test } from "../../test";

test.describe("API endpoint", () => {
  test("returns a PNG image", async ({ request }) => {
    let response = await request.get("/http/api/image");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect((await response.body()).byteLength).toBeGreaterThan(0);
  });
});
