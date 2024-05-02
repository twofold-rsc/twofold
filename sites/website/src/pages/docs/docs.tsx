import "server-only";
import Markdoc, { Config, Tag, Node, Schema, NodeType } from "@markdoc/markdoc";
import { readFile, readdir } from "fs/promises";
import * as path from "path";
import React, { cache } from "react";
import { Counter } from "./counter";
import { notFound } from "@twofold/framework/not-found";

export async function Guide({ slug }: { slug: string }) {
  let content = await loadGuide(slug);

  let components = {
    Counter,
  };

  return <>{Markdoc.renderers.react(content, React, { components })}</>;
}

let loadGuide = cache(async (slug: string) => {
  let guides = await availableGuides();

  if (!guides.includes(slug)) {
    notFound();
  }

  let filePath = path.join(process.cwd(), `./src/pages/docs/guides/${slug}.md`);
  let raw = await readFile(filePath, "utf-8");
  let ast = Markdoc.parse(raw);

  let config: Config = {
    tags: {
      counter: {
        render: "Counter",
        children: [],
        attributes: {},
      },
    },
    nodes: {
      heading,
    },
    variables: {},
  };

  let content = Markdoc.transform(ast, config);
  return content;
});

let availableGuides = cache(async () => {
  let directoryPath = path.join(process.cwd(), "./src/pages/docs/guides");
  let files = await readdir(directoryPath);
  let guides = files
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.parse(file).name);
  return guides;
});

export let getTitleFromSlug = cache(async (slug: string) => {
  let content = await loadGuide(slug);
  return getTitle(content);
});

function getTitle(node: any) {
  if (!node) {
    return;
  }

  if (!node.children) {
    return;
  }

  let title = node.children.reduce((acc: null | string, child: any) => {
    if (acc) {
      return acc;
    }

    if (child.name === "h1" && typeof child.children[0] === "string") {
      return child.children[0];
    }

    return getTitle(child);
  }, null);

  return title;
}

export let getHeadingsFromSlug = cache(async (slug: string) => {
  let content = await loadGuide(slug);
  return getHeadings(content);
});

function getHeadings(
  node: any,
  sections: { title: string; level: number; id: string }[] = [],
) {
  if (node && node.name) {
    let match = node.name.match(/h\d+/);
    if (match) {
      let title = node.children[0];

      if (typeof title === "string") {
        sections.push({
          title,
          id: node.attributes.id,
          level: node.attributes.level,
        });
      }
    } else if (node.children) {
      for (let child of node.children) {
        getHeadings(child, sections);
      }
    }
  }

  return sections;
}

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
        : children
            .filter((child) => typeof child === "string")
            .join(" ")
            .replace(/[?]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase();

    return new Tag(
      `h${node.attributes["level"]}`,
      { ...attributes, id },
      children,
    );
  },
};
