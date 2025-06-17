import { ShikiTransformer } from "shiki";

type Options = {
  color?: string;
  class?: string;
};

export function transformerClientComponentBoundary(
  options: Options = {},
): ShikiTransformer {
  let color = options.color;

  return {
    preprocess(code) {
      let lines = code.split("\n");
      let out: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        out.push(line);
        if (line.trim() === "// ![client-component-boundary]") {
          out.push('"use client";');
        }
      }

      return out.join("\n");
    },

    line(node) {
      if (
        node.type === "element" &&
        node.children.length === 1 &&
        node.children[0].type === "element" &&
        node.children[0].children.length === 1 &&
        node.children[0].children[0].type === "text" &&
        node.children[0].children[0].value === "// ![client-component-boundary]"
      ) {
        node.type = "element";
        node.tagName = "div";
        node.properties = {
          class: ["client-component-boundary", options.class ?? ""],
          style: `${color ? `color: ${color};` : ""}`,
        };
        node.children = [
          {
            type: "element",
            tagName: "svg",
            properties: {
              viewBox: "0 0 100 5",
              preserveAspectRatio: "none",
              style: "width: 100%; height: 100%;",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "0.4",
            },
            children: [
              {
                type: "element",
                tagName: "path",
                properties: {
                  d: generateZigZagPath({
                    count: 50,
                    height: 1.25,
                    baseline: 2.5,
                  }),
                },
                children: [],
              },
            ],
          },
        ];
      }
    },
  };
}

function generateZigZagPath({
  count,
  height = 2.5,
  baseline = 2.5,
}: {
  count: number;
  height?: number;
  baseline?: number;
}): string {
  let width = 100;
  let step = width / count;
  let cpX = step / 2;
  let cpY = baseline - height;

  let path: string[] = [];

  path.push(`M0,${baseline}`);
  path.push(`L0,${baseline + 0.125}`); // vertical left edge

  path.push(`Q${cpX},${cpY} ${step},${baseline}`);

  for (let i = 2; i <= count; i++) {
    path.push(`T${step * i},${baseline}`);
  }

  path.push(`L${width},${baseline + 0.125}`); // vertical right edge

  return path.join(" ");
}
