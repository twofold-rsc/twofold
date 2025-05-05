import { RenderableTreeNode } from "@markdoc/markdoc";

export function getTitle(node: RenderableTreeNode): string | undefined {
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

export function getHeadings(
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
