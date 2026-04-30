import { Layout } from "../../../src/backend/build/rsc/layout.ts";
import { expect, test } from "vitest";
import { Page } from "../../../src/backend/build/rsc/page.ts";
import { pathPartialMatches } from "../../../src/backend/runtime/helpers/routing.ts";

const loadModule = async () => {
  return {};
};

function createLayout(path: string) {
  return new Layout({
    path,
    loadModule,
  });
}

function createPage(path: string) {
  return new Page({
    path,
    loadModule,
  });
}

test("partial path match works as expected", () => {
  expect(pathPartialMatches("/(b)/page/(b)/cc", "/page/cc/action")).toBe(true);
  expect(pathPartialMatches("/(b)/page/(b)/cccc", "/page/cc/action")).toBe(
    false,
  );
  expect(pathPartialMatches("/(b)/page/(b)/cc", "/page/cccc/action")).toBe(
    false,
  );
  expect(pathPartialMatches("/(b)/page/(b)/cccc", "/page/cccc/action")).toBe(
    true,
  );
});

test("find nearest parent auth returns correct value", () => {
  let root = createLayout("/");
  let fluid = createLayout("/(fluid)");
  let admin = createLayout("/(main)/admin");
  let aa = createLayout("/(a)/page/(a)");
  let aap = createLayout("/(a)/page/(a)/page");
  let ab = createLayout("/(a)/page/(b)");
  let ba = createLayout("/(b)/page/(a)");
  let bb = createLayout("/(b)/page/(b)");
  let cc = createPage("/(b)/page/(b)/cc");
  let cccc = createPage("/(b)/page/(b)/cccc");

  let layouts = [fluid, admin, aap, aa, ab, ba, bb, cc, cccc];
  layouts.map((f) => root.addChild(f));

  root.tree.print();

  const expectations: Record<string, any> = {
    "/(main)/admin/receipts/PathTestProtectedComponent": admin,
    "/(main)/admin/page/action": admin,
    "/(main)/admin/page": admin,
    "/(main)/admin": admin,
    "/(fluid)/admin": fluid,
    "/(fluid)/page/action": fluid,
    "/(fluid)/page/Component": fluid,
    "/(a)/page/(a)/page/action": aap,
    "/(a)/page/(a)/page": aap,
    "/(a)/page/(a)": aa,
    "/(a)/page/(a)/action": aa,
    "/(a)/page/(b)/action": ab,
    "/(b)/page/(a)/action": ba,
    "/(b)/page/(b)/action": bb,
    "/(b)/page/(b)/cc": cc,
    "/(b)/page/(b)/cc/action": cc,
    "/(b)/page/(b)/cccc/action": cccc,
  };
  for (const path of Object.getOwnPropertyNames(expectations)) {
    expect(root.tree.findNearestParentAuthForPathlessPath(path)).toBe(
      expectations[path],
    );
  }
});
