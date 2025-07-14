import { Schema, Tag } from "@markdoc/markdoc";

export const CLIMarkdocTags: Record<string, Schema> = {
  "cli-command": {
    render: "CLICommand",
    children: ["tool"],
    attributes: {
      selectable: {
        type: Boolean,
        default: false,
        required: false,
      },
      shadow: {
        type: Boolean,
        default: true,
        required: false,
      },
      mobileOverflow: {
        type: Boolean,
        default: false,
        required: false,
      },
    },
    transform(node, config) {
      const attributes = node.transformAttributes(config);
      const tools = node.transformChildren(config);
      return new Tag(this.render, { tools, ...attributes }, []);
    },
  },
  "cli-tool": {
    children: ["paragraph", "text", "raw"],
    attributes: {
      name: { type: String, required: true },
    },
    transform(node, config) {
      let { name } = node.transformAttributes(config);
      let children = node.transformChildren(config);

      let command = children
        .map((child) =>
          typeof child === "object" && child !== null && "children" in child
            ? child.children
            : "",
        )
        .join("");

      return {
        name,
        command,
      };
    },
  },
};
