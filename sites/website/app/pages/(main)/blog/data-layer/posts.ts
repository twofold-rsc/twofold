import Markdoc, { Config, Schema, Tag } from "@markdoc/markdoc";
import { notFound } from "@twofold/framework/not-found";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { z } from "zod";
import yaml from "js-yaml";
import slugify from "@sindresorhus/slugify";

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

  let config: Config = {
    tags: {
      // make tags a per post config
      demo1: {
        render: "Demo1",
        attributes: {},
      },
      demo2: {
        render: "Demo2",
        attributes: {},
      },
      demo3: {
        render: "Demo3",
        attributes: {},
      },
      demo4: {
        render: "Demo4",
        attributes: {},
      },
      demo5: {
        render: "Demo5",
        attributes: {},
      },
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
