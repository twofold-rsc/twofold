import { CatchBoundary } from "../../../src/backend/build/rsc/catch-boundary.ts";
import { ErrorTemplate } from "../../../src/backend/build/rsc/error-template.ts";
import { Generic } from "../../../src/backend/build/rsc/generic.ts";
import { Layout } from "../../../src/backend/build/rsc/layout.ts";
import { Page } from "../../../src/backend/build/rsc/page.ts";
import { expect, test } from "vitest";

const fileUrl = new URL("file:///tmp/dummy.js");
const routeStackPlaceholder = new Generic({ fileUrl });

function createLayout(path: string) {
  return new Layout({
    path,
    fileUrl,
    routeStackPlaceholder,
  });
}

function createPage(path: string) {
  return new Page({
    path,
    fileUrl,
  });
}

function createCatchBoundary(path: string) {
  return new CatchBoundary({
    path,
    fileUrl,
    routeStackPlaceholder,
  });
}

function createErrorTemplate(path: string, tag: string) {
  return new ErrorTemplate({
    path,
    tag,
    fileUrl,
  });
}

test("the order of adding files to the tree does not matter", () => {
  function permutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of permutations(rest)) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  const positions = [0, 1, 2, 3, 4];
  const allOrderings = permutations(positions);

  for (const ordering of allOrderings) {
    let root = createLayout("/");
    let about = createPage("/about");
    let posts = createLayout("/posts");
    let postsIndex = createPage("/posts");
    let catchBoundary = createCatchBoundary("/");
    let notFoundErrorTemplate = createErrorTemplate("/", "not-found");

    let layouts = [
      about,
      posts,
      postsIndex,
      catchBoundary,
      notFoundErrorTemplate,
    ];

    expect(positions.length).toEqual(layouts.length);

    for (const index of ordering) {
      root.addChild(layouts[index]);
    }

    // root
    expect(root.children).toHaveLength(1);
    expect(root.children).toContain(catchBoundary);
    expect(root.parent).toBeUndefined();

    // catch boundary
    expect(catchBoundary.children).toHaveLength(3);
    expect(catchBoundary.children).toContain(posts);
    expect(catchBoundary.children).toContain(about);
    expect(catchBoundary.children).toContain(notFoundErrorTemplate);
    expect(catchBoundary.parent).toBe(root);

    // not found error template
    expect(notFoundErrorTemplate.children).toHaveLength(0);
    expect(notFoundErrorTemplate.parent).toBe(catchBoundary);

    // posts
    expect(posts.children).toHaveLength(1);
    expect(posts.children).toContain(postsIndex);
    expect(posts.parent).toBe(catchBoundary);

    // postsIndex
    expect(postsIndex.children).toHaveLength(0);
    expect(postsIndex.parent).toBe(posts);
  }
});
