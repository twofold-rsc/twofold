import "server-only";
import Markdoc, {
  Config,
  Tag,
  Schema,
  RenderableTreeNodes,
  RenderableTreeNode,
} from "@markdoc/markdoc";
import { readFile, readdir } from "fs/promises";
import * as path from "path";
import React, { cache } from "react";
import { Counter } from "./components/counter";
import { Fence } from "./components/fence";
import { CreateTwofoldApp } from "./components/create-twofold-app";
import { notFound } from "@twofold/framework/not-found";
import Link from "@twofold/framework/link";
import slugify from "@sindresorhus/slugify";

export async function DocPage({
  type,
  slug,
}: {
  type: "guide" | "reference" | "philosophy";
  slug: string;
}) {
  let content = await loadDocContent(type, slug);
  let title = getTitle(content);
  let headings = getHeadings(content);

  let basePath = `/docs/${type === "guide" ? "guides" : type === "philosophy" ? "philosophy" : "reference"}`;

  return (
    <>
      <title>{title}</title>
      <meta property="og:title" content={title} />

      <div className="col-span-5 min-w-0 sm:col-span-4 lg:col-span-3 lg:flex lg:justify-center">
        <div>
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-gray-500">Docs</span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-gray-500">
              {type === "guide"
                ? "Guides"
                : type === "philosophy"
                  ? "Philosophy"
                  : "Reference"}
            </span>
            <span className="text-xs text-gray-400">/</span>
            <Link
              href={`${basePath}/${slug}`}
              className="text-blue-500 hover:underline active:text-blue-600"
            >
              {title}
            </Link>
          </div>
          <div className="prose prose-h1:mb-4 first-of-type:prose-p:mt-0 mt-8">
            <MarkdocContent content={content} />
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-8">
          <div className="text-sm font-semibold text-gray-500">
            On this page
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {headings
              .filter((heading) => heading.level <= 2)
              .map((heading) => (
                <li key={heading.title}>
                  <Link
                    href={`${basePath}/${slug}${heading.level > 1 ? `#${heading.id}` : ""}`}
                  >
                    {heading.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}

async function MarkdocContent({ content }: { content: RenderableTreeNodes }) {
  let components = {
    Counter,
    Fence,
    CreateTwofoldApp,
  };

  return <>{Markdoc.renderers.react(content, React, { components })}</>;
}

let loadDocContent = cache(
  async (type: "guide" | "reference" | "philosophy", slug: string) => {
    let allDocs = await availableDocs();
    let docs = allDocs[type];

    let basePath =
      type === "guide"
        ? "guides"
        : type === "philosophy"
          ? "philosophy"
          : "reference";

    if (!docs.includes(slug)) {
      console.error(`Doc not found: ${type} ${slug}`);
      notFound();
    }

    let filePath = path.join(
      process.cwd(),
      `./app/pages/docs/${basePath}/${slug}.md`,
    );
    let raw = await readFile(filePath, "utf-8");
    let ast = Markdoc.parse(raw);

    let config: Config = {
      tags: {
        counter: {
          render: "Counter",
          children: [],
          attributes: {},
        },
        ["create-twofold-app"]: {
          render: "CreateTwofoldApp",
          children: [],
          attributes: {},
        },
      },
      nodes: {
        heading,
        fence,
      },
      variables: {},
    };

    let content = Markdoc.transform(ast, config);
    return content;
  },
);

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
  },
};

async function getDocSlugs(dir: "guides" | "reference" | "philosophy") {
  let directoryPath = path.join(process.cwd(), `./app/pages/docs/${dir}`);
  let files = await readdir(directoryPath);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.parse(file).name);
}

let availableDocs = cache(async () => {
  let guide = await getDocSlugs("guides");
  let reference = await getDocSlugs("reference");
  let philosophy = await getDocSlugs("philosophy");

  return {
    guide,
    reference,
    philosophy,
  };
});

function getTitle(node: RenderableTreeNode): string | undefined {
  if (!node) {
    return;
  }

  if (!(typeof node === "object")) {
    return;
  }

  if (!("children" in node)) {
    return;
  }

  if (!Array.isArray(node.children)) {
    return;
  }

  let title = node.children.reduce(
    (acc: undefined | string, child: RenderableTreeNode) => {
      if (acc || !child || typeof child !== "object") {
        return acc;
      }

      if (
        "name" in child &&
        child.name === "h1" &&
        Array.isArray(child.children) &&
        typeof child.children[0] === "string"
      ) {
        let potentialTitle = child.children[0];
        return potentialTitle;
      }

      return getTitle(child);
    },
    undefined,
  );

  return title;
}

function getHeadings(
  node: RenderableTreeNode,
  sections: { title: string; level: number; id: string }[] = [],
) {
  if (!node) {
    return [];
  }

  if (!(typeof node === "object")) {
    return [];
  }

  if (!("children" in node)) {
    return [];
  }

  if (!Array.isArray(node.children)) {
    return [];
  }

  if (typeof node.name !== "string") {
    return [];
  }

  let match = node.name.match(/h\d+/);
  if (match) {
    let title = node.children[0];
    let attributes = node.attributes;

    if (
      typeof title === "string" &&
      attributes &&
      typeof attributes === "object" &&
      "id" in attributes &&
      "level" in attributes
    ) {
      sections.push({
        title,
        id: attributes.id,
        level: attributes.level,
      });
    }
  } else if (node.children) {
    for (let child of node.children) {
      getHeadings(child, sections);
    }
  }

  return sections;
}
