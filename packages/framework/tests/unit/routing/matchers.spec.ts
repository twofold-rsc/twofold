import { describe, expect, test, vi } from "vitest";
import { RoutePath } from "../../../src/backend/build/rsc/route-path.ts";

describe("RoutePath validation", () => {
  test.each([
    "/",
    "/hello",
    "/hello/$world",
    "/hello/$world-world",
    "/hello/$[a-slug]",
    "/hello/$[a-slug]-world",
    "/hello/$$rest",
    "/hello/$$[all-things]",
    "/(group)/hello",
  ])("accepts %s", (path) => {
    expect(new RoutePath(path).isValid).toBe(true);
  });

  test.each([
    "hello",
    "/hello/",
    "/hello//world",
    "/hello/$$rest/world",
    "/hello/$world/$world",
    "/hello/$world-world/$world",
    "/hello/$[world]/$world",
    "/hello/$[]",
    "/hello/$[a slug]",
    "/hello/$[a-slug",
    "/hello/$$[all-things]/world",
  ])("rejects %s", (path) => {
    expect(new RoutePath(path).isValid).toBe(false);
  });
});

describe("RoutePath params", () => {
  test("extracts simple and bracketed params without exposing generated names", () => {
    let route = new RoutePath("/(group)/hello/$world-world/$[a-slug]");

    expect(
      route.params(
        new URL("https://example.com/hello/earth-world/a-dashed-value"),
      ),
    ).toEqual({
      world: "earth",
      "a-slug": "a-dashed-value",
    });
  });

  test("extracts bracketed catch-all params", () => {
    let route = new RoutePath("/docs/$$[all-things]");

    expect(route.params(new URL("https://example.com/docs/one/two"))).toEqual({
      "all-things": "one/two",
    });
  });

  test("constructs URLPattern lazily and reuses it", () => {
    let OriginalURLPattern = globalThis.URLPattern;
    let constructions = 0;
    let URLPatternProxy = new Proxy(OriginalURLPattern, {
      construct(target, args, newTarget) {
        constructions++;
        return Reflect.construct(target, args, newTarget);
      },
    });

    vi.stubGlobal("URLPattern", URLPatternProxy);

    try {
      let route = new RoutePath("/hello/$world");
      let url = new URL("https://example.com/hello/earth");

      route.matches(url.pathname);
      route.partiallyMatches(`${url.pathname}/details`);
      expect(constructions).toBe(0);

      expect(route.params(url)).toEqual({ world: "earth" });
      expect(route.params(url)).toEqual({ world: "earth" });
      expect(constructions).toBe(1);
    } finally {
      vi.stubGlobal("URLPattern", OriginalURLPattern);
    }
  });
});

describe("RoutePath apply", () => {
  test("applies dynamic params", () => {
    let route = new RoutePath("/hello/$world");
    expect(route.apply({ world: "earth" })).toBe("/hello/earth");
  });

  test("preserves a static suffix", () => {
    let route = new RoutePath("/hello/$world-world");
    expect(route.apply({ world: "earth" })).toBe("/hello/earth-world");
  });

  test("applies bracketed params", () => {
    let route = new RoutePath("/hello/$[a-slug]-world");
    expect(route.apply({ "a-slug": "earth" })).toBe("/hello/earth-world");
  });

  test("applies catch-all params", () => {
    let route = new RoutePath("/docs/$$rest");
    expect(route.apply({ rest: "one/two" })).toBe("/docs/one/two");
  });

  test("leaves params without values unchanged", () => {
    let route = new RoutePath("/hello/$world");
    expect(route.apply({})).toBe("/hello/$world");
  });
});

describe("RoutePath matches", () => {
  test.each([
    ["/", "/"],
    ["/hello", "/hello"],
    ["/hello/$world", "/hello/earth"],
    ["/docs/$$rest", "/docs/one"],
    ["/docs/$$rest", "/docs/one/two"],
    ["/(group)/hello/$world", "/hello/earth"],
  ])("matches %s against %s", (templatePath, realPath) => {
    expect(new RoutePath(templatePath).matches(realPath)).toBe(true);
  });

  test.each([
    ["/hello", "/goodbye"],
    ["/hello", "/hello/world"],
    ["/hello/$world", "/hello"],
    ["/hello/$world", "/hello/earth/mars"],
    ["/docs/$$rest", "/docs"],
  ])("does not match %s against %s", (templatePath, realPath) => {
    expect(new RoutePath(templatePath).matches(realPath)).toBe(false);
  });

  test("matches a dynamic segment with a static suffix", () => {
    let route = new RoutePath("/hello/$world-world");
    expect(route.matches("/hello/earth-world")).toBe(true);
  });

  test("matches a bracketed param containing a dash", () => {
    let route = new RoutePath("/hello/$[a-slug]");
    expect(route.matches("/hello/earth-world")).toBe(true);
  });

  test("matches a bracketed param with a static suffix", () => {
    let route = new RoutePath("/hello/$[a-slug]-world");
    expect(route.matches("/hello/earth-world")).toBe(true);
    expect(route.matches("/hello/earth")).toBe(false);
  });

  test("distinguishes bracketed names from static suffixes", () => {
    expect(new RoutePath("/hello/$a-slug").matches("/hello/earth-world")).toBe(
      false,
    );
    expect(
      new RoutePath("/hello/$[a-slug]").matches("/hello/earth-world"),
    ).toBe(true);
  });

  test("matches bracketed catch-all params", () => {
    let route = new RoutePath("/docs/$$[all-things]");
    expect(route.matches("/docs/one/two")).toBe(true);
  });

  test("requires the static suffix", () => {
    let route = new RoutePath("/hello/$world-world");
    expect(route.matches("/hello/earth")).toBe(false);
  });
});

describe("RoutePath partiallyMatches", () => {
  test.each([
    ["/", "/hello"],
    ["/hello", "/hello/world"],
    ["/hello/$world", "/hello/earth/details"],
    ["/(group)/hello", "/hello/world"],
  ])("partially matches %s against %s", (templatePath, realPath) => {
    expect(new RoutePath(templatePath).partiallyMatches(realPath)).toBe(true);
  });

  test.each([
    ["/hello", "/goodbye/world"],
    ["/hello/$world", "/hello"],
  ])("does not partially match %s against %s", (templatePath, realPath) => {
    expect(new RoutePath(templatePath).partiallyMatches(realPath)).toBe(false);
  });

  test("requires static suffixes", () => {
    let route = new RoutePath("/hello/$world-world");
    expect(route.partiallyMatches("/hello/earth/details")).toBe(false);
  });

  test("partially matches dynamic segments with static suffixes", () => {
    let route = new RoutePath("/hello/$world-world");
    expect(route.partiallyMatches("/hello/earth-world/details")).toBe(true);
  });

  test("partially matches bracketed params", () => {
    let route = new RoutePath("/hello/$[a-slug]");
    expect(route.partiallyMatches("/hello/earth-world/details")).toBe(true);
  });
});
