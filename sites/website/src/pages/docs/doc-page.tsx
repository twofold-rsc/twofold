import "server-only";
import Markdoc, {
  Config,
  Tag,
  Schema,
  RenderableTreeNodes,
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

      <div className="col-span-5 sm:col-span-4 lg:col-span-3 min-w-0">
        <div>
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-gray-500">Docs</span>
            <span className="text-gray-400 text-xs">/</span>
            <span className="text-gray-500">
              {type === "guide"
                ? "Guides"
                : type === "philosophy"
                  ? "Philosophy"
                  : "Reference"}
            </span>
            <span className="text-gray-400 text-xs">/</span>
            <Link
              href={`${basePath}/${slug}`}
              className="text-blue-500 hover:underline active:text-blue-600"
            >
              {title}
            </Link>
          </div>
          <div className="prose mt-8 prose-h1:mb-4 first-of-type:prose-p:mt-0">
            <MarkdocContent content={content} />
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-8">
          <div className="text-gray-500 text-sm font-semibold">
            On this page
          </div>
          <ul className="space-y-1 mt-1">
            {headings.map((heading) => (
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
      `./src/pages/docs/${basePath}/${slug}.md`,
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
  let directoryPath = path.join(process.cwd(), `./src/pages/docs/${dir}`);
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
