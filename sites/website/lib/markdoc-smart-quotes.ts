import { Node } from "@markdoc/markdoc";

function isWord(ch: string) {
  return /\p{L}|\p{N}/u.test(ch);
}

function smartenText(s: string) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    let ch = s[i];

    if (ch === '"') {
      let prev = s[i - 1] ?? "";
      let next = s[i + 1] ?? "";
      let opening =
        !prev ||
        /\s|[([{<–—-]/.test(prev) ||
        (next && isWord(next) && !isWord(prev));
      out += opening ? "“" : "”";
      continue;
    }

    if (ch === "'") {
      let prev = s[i - 1] ?? "";
      let next = s[i + 1] ?? "";

      // it's / don't / rock 'n' roll
      if (isWord(prev) && isWord(next)) {
        out += "’";
        continue;
      }
      // ’90s
      if (!isWord(prev) && /\d/.test(next)) {
        out += "’";
        continue;
      }
      // dogs'
      if (
        isWord(prev) &&
        next.toLowerCase() === "s" &&
        !isWord(s[i + 2] ?? "")
      ) {
        out += "’";
        continue;
      }

      let opening =
        !prev ||
        /\s|[([{<–—-]/.test(prev) ||
        (next && isWord(next) && !isWord(prev));
      out += opening ? "‘" : "’";
      continue;
    }

    out += ch;
  }
  return out;
}

let dontTransformNodes = ["code", "fence"];

function transformNode(node: Node): Node {
  if (dontTransformNodes.includes(node.type)) {
    return node;
  }

  if (Array.isArray(node.children)) {
    node.children = node.children.map(transformNode);
  }

  if (node.attributes) {
    for (let k of Object.keys(node.attributes)) {
      let v = node.attributes[k];
      if (shouldTransformAttribute(node, k, v)) {
        node.attributes[k] = smartenText(v);
      }
    }
  }

  return node;
}

let dontTransformAttributes = ["href", "src", "id", "slug", "class"];
let doTransformAttributes = ["alt", "title", "aria-label"];

export function shouldTransformAttribute(
  node: Node,
  key: string,
  value: unknown,
) {
  if (typeof value !== "string") {
    return false;
  }

  if (node.type === "document" && key === "frontmatter") {
    return false;
  }

  if (dontTransformAttributes.includes(key)) {
    return false;
  }

  if (doTransformAttributes.includes(key)) {
    return true;
  }

  if (node.type === "tag") {
    return true;
  }

  // main text nodes
  if (node.type === "text" && key === "content") {
    return true;
  }

  return false;
}

export function smartQuotesPlugin(ast: Node) {
  return transformNode(ast);
}
