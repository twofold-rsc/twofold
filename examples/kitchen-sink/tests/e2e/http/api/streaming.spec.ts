import { expect, test } from "../../test";

test.describe("page", () => {
  test("streams API data", async ({ page }) => {
    await page.goto("/http/api/streaming");

    await page.getByRole("button", { name: "Stream" }).click();

    let response = page.getByTestId("api-stream-response");
    await expect(response).toHaveText("First. ");
    await expect(response).toHaveText("First. Second. ");
    await expect(response).toHaveText("First. Second. Third. ");
    await expect(response).toHaveText(
      "First. Second. Third. Finished.",
    );
  });
});

test.describe("API endpoint", () => {
  test("returns stream chunks incrementally", async () => {
    let baseURL = test.info().project.use.baseURL;
    if (!baseURL) {
      throw new Error("Expected a base URL");
    }

    let response = await fetch(new URL("/http/api/streaming", baseURL));

    expect(response.status).toBe(200);
    if (!response.body) {
      throw new Error("Expected a response body");
    }

    let reader = response.body.getReader();
    let decoder = new TextDecoder();
    let text = "";

    for (let expected of [
      "First. ",
      "First. Second. ",
      "First. Second. Third. ",
      "First. Second. Third. Finished.",
    ]) {
      let { value, done } = await reader.read();
      expect(done).toBe(false);
      text += decoder.decode(value, { stream: true });
      expect(text).toBe(expected);
    }

    expect((await reader.read()).done).toBe(true);
  });
});
