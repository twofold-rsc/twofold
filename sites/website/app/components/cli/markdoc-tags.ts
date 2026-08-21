import { Schema, Tag } from "@markdoc/markdoc";

export const CLIMarkdocTags: Record<string, Schema> = {
  "cli-command": {
    render: "CLICommand",
    children: ["tag"],
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
    children: ["paragraph", "text"],
    attributes: {
      name: { type: String, required: true },
    },
    transform(node, config) {
      let { name } = node.transformAttributes(config);
      let children = node.transformChildren(config);

      let command = children
        .map((child) =>
          typeof child === "object" &&
          child !== null &&
          "children" in child &&
          child.children !== null
            ? Array.isArray(child.children)
              ? child.children
                  .reduce<string>(
                    (command, child) =>
                      typeof child === "string" ? command + child : command,
                    "",
                  )
              : ""
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
