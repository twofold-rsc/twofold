import { expect, test } from "../test";

test("navigates to the router props example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Props" }).click();

  await expect(page).toHaveURL("/routing/props");
  await expect(
    page.getByRole("heading", { name: "Router props" }),
  ).toBeVisible();
});

test("server-renders and hydrates dynamic and search props", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/props/a-page-with-a-param?search=true");

  await expect(
    page.getByText("slug: a-page-with-a-param", { exact: true }),
  ).toHaveCount(2);
  await expect(page.getByText("search: true", { exact: true })).toHaveCount(2);

  verifyNoErrors();
});

test("provides layout props to the index page", async ({ page, baseURL }) => {
  await page.goto("/routing/props");

  await expect(page.getByTestId("layout-params")).toHaveText("none");
  await expect(page.getByTestId("layout-search-params")).toHaveText("none");
  await expect(page.getByTestId("layout-url")).toHaveText(
    new URL("/routing/props", baseURL).href,
  );

  let request = JSON.parse(
    await page.getByTestId("layout-request").innerText(),
  );
  expect(request.method).toBe("GET");
  expect(Object.keys(request.headers)).not.toHaveLength(0);
});

test("provides page props to the index page", async ({ page, baseURL }) => {
  await page.goto("/routing/props");

  await expect(page.getByTestId("page-search-params")).toHaveText("none");
  await expect(page.getByTestId("page-url")).toHaveText(
    new URL("/routing/props", baseURL).href,
  );

  let request = JSON.parse(await page.getByTestId("page-request").innerText());
  expect(request.method).toBe("GET");
  expect(Object.keys(request.headers)).not.toHaveLength(0);
});

test("provides layout props to the param page", async ({ page, baseURL }) => {
  await page.goto("/routing/props/a-page-with-a-param");

  await expect(page.getByTestId("layout-params")).toHaveText(
    "slug: a-page-with-a-param",
  );
  await expect(page.getByTestId("layout-search-params")).toHaveText("none");
  await expect(page.getByTestId("layout-url")).toHaveText(
    new URL("/routing/props/a-page-with-a-param", baseURL).href,
  );

  let request = JSON.parse(
    await page.getByTestId("layout-request").innerText(),
  );
  expect(request.method).toBe("GET");
  expect(Object.keys(request.headers)).not.toHaveLength(0);
});

test("provides page props to the param page", async ({ page, baseURL }) => {
  await page.goto("/routing/props/a-page-with-a-param");

  await expect(page.getByTestId("page-params")).toHaveText(
    "slug: a-page-with-a-param",
  );
  await expect(page.getByTestId("page-search-params")).toHaveText("none");
  await expect(page.getByTestId("page-url")).toHaveText(
    new URL("/routing/props/a-page-with-a-param", baseURL).href,
  );

  let request = JSON.parse(await page.getByTestId("page-request").innerText());
  expect(request.method).toBe("GET");
  expect(Object.keys(request.headers)).not.toHaveLength(0);
});

test("provides layout props to the search params page", async ({
  page,
  baseURL,
}) => {
  await page.goto("/routing/props/a-page-with-a-param?search=true");
  await expect(page.getByTestId("layout-params")).toHaveText(
    "slug: a-page-with-a-param",
  );
  await expect(page.getByTestId("layout-search-params")).toHaveText(
    "search: true",
  );
  await expect(page.getByTestId("layout-url")).toHaveText(
    new URL(
      "/routing/props/a-page-with-a-param?search=true",
      baseURL,
    ).href,
  );

  let request = JSON.parse(
    await page.getByTestId("layout-request").innerText(),
  );
  expect(request.method).toBe("GET");
  expect(Object.keys(request.headers)).not.toHaveLength(0);
});

test("provides page props to the search params page", async ({
  page,
  baseURL,
}) => {
  await page.goto("/routing/props/a-page-with-a-param?search=true");

  await expect(page.getByTestId("page-params")).toHaveText(
    "slug: a-page-with-a-param",
  );
  await expect(page.getByTestId("page-search-params")).toHaveText(
    "search: true",
  );
  await expect(page.getByTestId("page-url")).toHaveText(
    new URL(
      "/routing/props/a-page-with-a-param?search=true",
      baseURL,
    ).href,
  );

  let request = JSON.parse(await page.getByTestId("page-request").innerText());
  expect(request.method).toBe("GET");
  expect(Object.keys(request.headers)).not.toHaveLength(0);
});
