import Markdoc, { Config, RenderableTreeNodes, Tag } from "@markdoc/markdoc";
import slugify from "@sindresorhus/slugify";
import Link from "@twofold/framework/link";
import { notFound } from "@twofold/framework/not-found";
import { PageProps } from "@twofold/framework/types";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import React, { cache } from "react";
import { Fence } from "./components/fence";
import { CreateTwofoldApp } from "./components/create-twofold-app";
import { DeploymentGrid } from "./components/deployment-grid";
import { Callout } from "./components/callout";
import { Image } from "./components/image";
import { getHeadings, getTitle } from "../../../markdoc/utils";
import { CLICommand } from "../../../components/cli/command";
import { CLIMarkdocTags } from "../../../components/cli/markdoc-tags";

let allowedDirectories = ["reference", "guides", "philosophy"];

export default async function DocPage({ params, request }: PageProps<"doc">) {
  let parts = params.doc.split("/");
  let [type, ...path] = parts;

  if (!type || !allowedDirectories.includes(type)) {
    notFound();
  }

  let subtype = path.length > 1 ? path[0] : undefined;

  let subtypeSlug = [type, subtype].filter(Boolean).join("/");
  let slug = [type, ...path].join("/");

  let content = await loadDocContent(slug);
  let title = getTitle(content);
  let headings = getHeadings(content);

  let url = new URL(request.url);
  let ogImageUrl = new URL("/og-image.png", url.origin);

  return (
    <>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta property="og:site_name" content="Twofold" />
      <meta property="og:image" content={ogImageUrl.href} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:image" content={ogImageUrl.href} />

      <div className="col-span-5 min-w-0 sm:col-span-4 lg:col-span-3 lg:flex lg:justify-center">
        <div>
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-gray-500">Docs</span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-gray-500">
              {type === "guides"
                ? "Guides"
                : type === "philosophy"
                  ? "Philosophy"
                  : "Reference"}
            </span>
            <span className="text-xs text-gray-400">/</span>

            {subtype && (
              <>
                <Link
                  href={`/docs/${subtypeSlug}`}
                  className="text-gray-500 hover:underline active:text-gray-600"
                >
                  {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                </Link>
                <span className="text-xs text-gray-400">/</span>
              </>
            )}

            <Link
              href={`/docs/${slug}`}
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
                    href={`/docs/${slug}${heading.level > 1 ? `#${heading.id}` : ""}`}
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

let loadDocContent = cache(async (slug: string) => {
  let allDocs = await getDocFiles();

  if (!allDocs.includes(slug)) {
    console.error(`Doc not found: ${slug}`);
    notFound();
  }

  let filePath = path.join(process.cwd(), `./app/pages/(main)/docs/${slug}.md`);
  let raw = await readFile(filePath, "utf-8");
  let ast = Markdoc.parse(raw);

  let config: Config = {
    tags: {
      callout: {
        render: "Callout",
        children: ["inline"],
        attributes: {},
      },
      "create-twofold-app": {
        render: "CreateTwofoldApp",
        children: [],
        attributes: {},
      },
      "deployment-grid": {
        render: "DeploymentGrid",
        children: [],
        attributes: {},
      },
      image: {
        render: "Image",
        children: [],
        attributes: {
          src: { type: String, required: true },
          alt: { type: String, required: false },
          border: {
            type: Boolean,
            default: false,
            required: false,
          },
        },
      },
      ...CLIMarkdocTags,
    },
    nodes: {
      heading: {
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
                  children
                    .filter((child) => typeof child === "string")
                    .join(" "),
                );

          return new Tag(
            `h${node.attributes["level"]}`,
            { ...attributes, id },
            children,
          );
        },
      },
      fence: {
        render: "Fence",
        attributes: {
          language: {
            type: String,
          },
        },
      },
    },
    variables: {},
  };

  let content = Markdoc.transform(ast, config);
  return content;
});

let components = {
  Callout,
  Fence,
  CreateTwofoldApp,
  DeploymentGrid,
  Image,
  CLICommand,
};

async function MarkdocContent({ content }: { content: RenderableTreeNodes }) {
  return <>{Markdoc.renderers.react(content, React, { components })}</>;
}

async function getDocFiles() {
  let directoryPath = path.join(process.cwd(), `./app/pages/(main)/docs/`);
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
}
