import Markdoc, { Config, Schema, Tag } from "@markdoc/markdoc";
import { notFound } from "@twofold/framework/not-found";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { cache, ComponentType } from "react";
import { z } from "zod";
import yaml from "js-yaml";
import slugify from "@sindresorhus/slugify";
import * as PromisePost from "../posts/you-can-serialize-a-promise-in-react/components";
import * as StreamingPost from "../posts/composable-streaming-with-suspense/components";
import { getTitle } from "../../../../markdoc/utils";

export const getPostSlugs = cache(async () => {
  let directoryPath = path.join(
    process.cwd(),
    `./app/pages/(main)/blog/posts/`,
  );

  let files = await readdir(directoryPath, {
    recursive: true,
    withFileTypes: true,
  });

  return files
    .filter((file) => file.isFile())
    .filter((file) => file.name === "post.md")
    .map((file) =>
      path
        .relative(directoryPath, path.join(file.parentPath, file.name))
        .replace(/\/post\.md$/, ""),
    );
});

export const getPosts = cache(async function getPosts() {
  let slugs = await getPostSlugs();

  let postsPromise = slugs.map(async (slug) => {
    let content = await loadContent(slug);
    let frontmatter = await loadMetadata(slug);
    let title = getTitle(content);

    return {
      title: title ?? "No title",
      slug,
      date: frontmatter.lastUpdated ? new Date(frontmatter.lastUpdated) : null,
      description: frontmatter.description ?? "",
    };
  });

  return Promise.all(postsPromise);
});

export const loadAst = cache(async (slug: string) => {
  let allPosts = await getPostSlugs();

  if (!allPosts.includes(slug)) {
    console.error(`Post not found: ${slug}`);
    notFound();
  }

  let postFile = `${slug}/post.md`;
  let filePath = path.join(
    process.cwd(),
    `./app/pages/(main)/blog/posts/${postFile}`,
  );
  let raw = await readFile(filePath, "utf-8");
  let ast = Markdoc.parse(raw);

  return ast;
});

let frontmatterSchema = z.object({
  lastUpdated: z.string(),
  description: z.string(),
});

export const loadComponents = cache(async (slug: string) => {
  let allPosts = await getPostSlugs();

  if (!allPosts.includes(slug)) {
    console.error(`Post components not found: ${slug}`);
    notFound();
  }

  let map: Record<string, Record<string, ComponentType<never>>> = {
    "you-can-serialize-a-promise-in-react": PromisePost.components,
    "composable-streaming-with-suspense": StreamingPost.components,
  };

  let components = map[slug] ?? {};

  return components;
});

export const loadTags = cache(async (slug: string) => {
  let allPosts = await getPostSlugs();

  if (!allPosts.includes(slug)) {
    console.error(`Post components not found: ${slug}`);
    notFound();
  }

  let map: Record<string, Record<string, Schema>> = {
    "you-can-serialize-a-promise-in-react": PromisePost.tags,
    "composable-streaming-with-suspense": StreamingPost.tags,
  };

  let tags = map[slug] ?? {};

  return tags;
});

export const loadMetadata = cache(async (slug: string) => {
  let ast = await loadAst(slug);
  let rawFrontmatter = ast.attributes.frontmatter;
  if (typeof rawFrontmatter !== "string") {
    throw new Error("Frontmatter not found");
  }
  let frontmatter = frontmatterSchema.parse(
    yaml.load(ast.attributes.frontmatter),
  );

  return frontmatter;
});

export const loadContent = cache(async (slug: string) => {
  let ast = await loadAst(slug);
  let tags = await loadTags(slug);

  let config: Config = {
    tags: {
      ...tags,
      footnote: {
        render: "Footnote",
        attributes: {
          id: { type: String, required: true },
          children: { type: Array, required: true },
        },
      },
      // callout: {
      //   render: "Callout",
      //   children: ["inline"],
      //   attributes: {},
      // },
      // image: {
      //   render: "Image",
      //   children: [],
      //   attributes: {
      //     src: { type: String, required: true },
      //     alt: { type: String, required: false },
      //     border: {
      //       type: Boolean,
      //       default: false,
      //       required: false,
      //     },
      //   },
      // },
    },
    nodes: {
      heading,
      fence,
    },
    variables: {},
  };

  let content = Markdoc.transform(ast, config);
  return content;
});

let heading: Schema = {
  children: ["inline"],
  attributes: {
    id: { type: String },
    level: { type: Number, required: true, default: 1 },
  },
  transform(node, config) {
    let attributes = node.transformAttributes(config);
    let children = node.transformChildren(config);

    let id =
      attributes.id && typeof attributes.id === "string"
        ? attributes.id
        : slugify(
            children.filter((child) => typeof child === "string").join(" "),
          );

    return new Tag(
      `h${node.attributes["level"]}`,
      { ...attributes, id },
      children,
    );
  },
};

let fence: Schema = {
  render: "Fence",
  attributes: {
    language: {
      type: String,
    },
    file: {
      type: String,
    },
    demo: {
      type: Boolean,
    },
  },
};
