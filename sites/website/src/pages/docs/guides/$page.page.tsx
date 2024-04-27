import Markdoc, { Config } from "@markdoc/markdoc";
import { readFile, readdir } from "fs/promises";
import * as path from "path";
import React from "react";
import { Counter } from "../counter";
import { notFound } from "@twofold/framework/not-found";

export default async function DocPage({
  params,
}: {
  params: { page: string };
}) {
  return (
    <div>
      <div className="mt-4 text-xs text-gray-900">
        Viewing {params.page} doc page.
      </div>
      <div className="prose">
        <Guide slug={params.page} />
      </div>
    </div>
  );
}

async function availableGuides() {
  let directoryPath = path.join(process.cwd(), "./src/pages/docs/guides");
  let files = await readdir(directoryPath);
  let guides = files
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.parse(file).name);
  return guides;
}

async function Guide({ slug }: { slug: string }) {
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
    nodes: {},
    variables: {},
  };

  let components = {
    Counter,
  };

  let content = Markdoc.transform(ast, config);
  let title = getTitle(content) ?? "Guides";

  return (
    <>
      <title>{title}</title>
      {Markdoc.renderers.react(content, React, { components })}
    </>
  );
}

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
