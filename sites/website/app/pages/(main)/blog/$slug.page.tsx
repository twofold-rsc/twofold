import Markdoc, {
  Config,
  RenderableTreeNode,
  RenderableTreeNodes,
  Schema,
  Tag,
} from "@markdoc/markdoc";
import slugify from "@sindresorhus/slugify";
import Link from "@twofold/framework/link";
import { notFound } from "@twofold/framework/not-found";
import { PageProps } from "@twofold/framework/types";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import React, { cache } from "react";
import { Fence } from "./components/fence";
import { Demo1 } from "./you-can-serialize-a-promise-in-react/demo1";
import { Demo2 } from "./you-can-serialize-a-promise-in-react/demo2";
import { Demo3 } from "./you-can-serialize-a-promise-in-react/demo3";
import { Demo4 } from "./you-can-serialize-a-promise-in-react/demo4";
import { Demo5 } from "./you-can-serialize-a-promise-in-react/demo5";
import { Footnote } from "./components/footnote";
import z from "zod";
// import { Callout } from "./components/callout";
// import { Image } from "./components/image";
// import "./docs.css";

export default async function DocPage({ params, request }: PageProps<"slug">) {
  let slug = params.slug;

  let content = await loadContent(slug);
  let title = getTitle(content);
  let headings = getHeadings(content);

  let meta = await loadMetadata(slug);

  let url = new URL(request.url);
  let ogImageUrl = new URL(`/images/blog/${slug}/og-image.png`, url.origin);

  return (
    <>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={ogImageUrl.href} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url.href} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImageUrl.href} />

      <div className="min-w-0">
        <div>
          <div className="flex items-center space-x-2 font-medium">
            <Link
              href={`/blog`}
              className="text-sm text-gray-500 hover:underline active:text-gray-600"
            >
              Blog
            </Link>
            <span className="text-xs text-gray-400">/</span>
            <Link
              href={`/blog/${slug}`}
              className="text-sm text-blue-500 hover:underline active:text-blue-600"
            >
              {title}
            </Link>
          </div>
          <div className="prose prose-h1:mb-4 prose-li:font-serif prose-p:font-serif first-of-type:prose-p:mt-0 mt-8">
            <MarkdocContent content={content} />
            {meta.lastUpdated && (
              <div className="mt-12 font-serif text-sm text-gray-500">
                Last updated:{" "}
                {new Date(meta.lastUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <div className="hidden lg:block">
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
                    href={`/docs/${slug}${heading.level > 1 ? `#${heading.id}` : ""}`}
                  >
                    {heading.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div> */}
    </>
  );
}

let loadAst = cache(async (slug: string) => {
  let allPosts = await getPostFiles();

  if (!allPosts.includes(`${slug}/post`)) {
    console.error(`Post not found: ${slug}`);
    notFound();
  }

  let postFile = `${slug}/post.md`;
  let filePath = path.join(
    process.cwd(),
    `./app/pages/(main)/blog/${postFile}`,
  );
  let raw = await readFile(filePath, "utf-8");
  let ast = Markdoc.parse(raw);

  return ast;
});

let loadContent = cache(async (slug: string) => {
  let ast = await loadAst(slug);

  let config: Config = {
    tags: {
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

let frontmatterSchema = z.object({
  lastUpdated: z.string(),
  description: z.string(),
});

let loadMetadata = cache(async (slug: string) => {
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

async function MarkdocContent({ content }: { content: RenderableTreeNodes }) {
  let components = {
    Demo1,
    Demo2,
    Demo3,
    Demo4,
    Demo5,
    Fence,
    Footnote,
    // Callout,
    // Image,
  };

  return <>{Markdoc.renderers.react(content, React, { components })}</>;
}

let getPostFiles = cache(async () => {
  let directoryPath = path.join(process.cwd(), `./app/pages/(main)/blog/`);
  let files = await readdir(directoryPath, {
    recursive: true,
    withFileTypes: true,
  });

  return files
    .filter((file) => file.isFile())
    .filter((file) => file.name.endsWith(".md"))
    .map((file) =>
      path
        .relative(directoryPath, path.join(file.parentPath, file.name))
        .replace(/\.md$/, ""),
    );
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
