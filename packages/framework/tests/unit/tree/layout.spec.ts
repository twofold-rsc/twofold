import { Generic } from "../../../src/backend/build/rsc/generic.ts";
import { Layout } from "../../../src/backend/build/rsc/layout.ts";
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

test("adds a layout to another layout", () => {
  let root = createLayout("/");
  let about = createLayout("/about");

  root.addChild(about);

  expect(root.children).toContain(about);
  expect(about.parent).toBe(root);
});

test("adds a layout to an existing tree of layouts", () => {
  let root = createLayout("/");
  let about = createLayout("/about");
  let contact = createLayout("/contact");

  root.addChild(about);
  root.addChild(contact);

  expect(root.children).toContain(about);
  expect(root.children).toContain(contact);
});

test("errors if a layout cannot be added to another", () => {
  let root = createLayout("/other");
  let nope = createLayout("/nope");

  expect(() => {
    root.addChild(nope);
  }).toThrowError("Could not add child");
});

test("adds a layout to an existing child layout", () => {
  let root = createLayout("/");
  let posts = createLayout("/posts");
  let post = createLayout("/posts/$slug");

  root.addChild(posts);
  root.addChild(post);

  expect(root.children).toContain(posts);
  expect(root.children).toHaveLength(1);

  expect(posts.children).toContain(post);
  expect(posts.children).toHaveLength(1);

  expect(post.parent).toBe(posts);
  expect(posts.parent).toBe(root);
});

test("the tree is rebalanced after a layout is added", () => {
  let root = createLayout("/");
  let post = createLayout("/posts/$slug");
  let posts = createLayout("/posts");

  root.addChild(post);
  expect(root.children).toContain(post);
  expect(post.parent).toBe(root);

  root.addChild(posts);

  expect(root.children).toContain(posts);
  expect(root.children).toHaveLength(1);

  expect(root.children).not.toContain(post);
  expect(post.parent).not.toBe(root);

  expect(posts.children).toContain(post);
  expect(posts.children).toHaveLength(1);

  expect(post.parent).toBe(posts);
  expect(posts.parent).toBe(root);
});

test("the order of adding layouts does not matter", () => {
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

  const allOrderings = permutations([0, 1, 2, 3, 4, 5]);

  for (const ordering of allOrderings) {
    let root = createLayout("/");
    let posts = createLayout("/posts");
    let post = createLayout("/posts/$slug");
    let topPosts = createLayout("/posts/top");
    let postComments = createLayout("/posts/$slug/comments");
    let postMeta = createLayout("/posts/$slug/meta");
    let about = createLayout("/about");

    let layouts = [posts, post, topPosts, postComments, postMeta, about];

    for (const index of ordering) {
      root.addChild(layouts[index]);
    }

    // root
    expect(root.children).toHaveLength(2);
    expect(root.children).toContain(posts);
    expect(root.children).toContain(about);

    // about
    expect(about.children).toHaveLength(0);
    expect(about.parent).toBe(root);

    // posts
    expect(posts.children).toHaveLength(2);
    expect(posts.children).toContain(post);
    expect(posts.children).toContain(topPosts);
    expect(posts.parent).toBe(root);

    // topPosts
    expect(topPosts.children).toHaveLength(0);
    expect(topPosts.parent).toBe(posts);

    // post
    expect(post.children).toHaveLength(2);
    expect(post.children).toContain(postComments);
    expect(post.children).toContain(postMeta);
    expect(post.parent).toBe(posts);

    // postComments
    expect(postComments.children).toHaveLength(0);
    expect(postComments.parent).toBe(post);

    // postMeta
    expect(postMeta.children).toHaveLength(0);
    expect(postMeta.parent).toBe(post);
  }
});
