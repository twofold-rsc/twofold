import { ShikiTransformer } from "shiki";

type Options = {
  color?: string;
  class?: string;
};

const TOKEN = "// ![client-boundary]";

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
        if (line.trim() === TOKEN) {
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
        node.children[0].children[0].value === TOKEN
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
              viewBox: generateViewBox(),
              preserveAspectRatio: "none",
              style: "width: 100%; height: 100%;",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": generateStrokeWidth(),
              "stroke-linecap": "round",
            },
            children: [
              {
                type: "element",
                tagName: "path",
                properties: {
                  d: generateZigZagPath(),
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

let segments = 40;
let amplitude = 5;
let step = 8;
let peakSmoothness = 0.75;

let strokeRatio = 0.15;
let padding = 4;

function generateStrokeWidth() {
  let diagonal = Math.sqrt(step ** 2 + amplitude ** 2);
  return diagonal * strokeRatio;
}

function generateZigZagPath() {
  let path = `M0,0`;

  for (let i = 0; i < segments; i++) {
    let x0 = i * step;
    let y0 = i % 2 === 0 ? 0 : -amplitude;
    let x1 = (i + 1) * step;
    let y1 = i % 2 === 0 ? -amplitude : 0;

    if (peakSmoothness === 0) {
      path += ` L${x1},${y1}`;
    } else {
      let cpOffset = (x1 - x0) * 0.5 * peakSmoothness;
      path += ` C${x0 + cpOffset},${y0} ${x1 - cpOffset},${y1} ${x1},${y1}`;
    }
  }

  return path;
}

function generateViewBox() {
  let width = segments * step;
  let height = amplitude + padding * 2;
  return `0 ${-amplitude - padding} ${width} ${height}`;
}
