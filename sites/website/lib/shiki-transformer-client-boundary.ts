import { ShikiTransformer } from "shiki";
import invariant from "tiny-invariant";

export type Options = {
  color?: string;
  class?: string;
  segments?: number;
  height?: number;
  minSegmentWidth?: number;
  strokeWidth?: number;
  strokeDasharray?: string;
  peakSmoothness?: number;
  verticalPadding?: number;
};

const TOKEN = "// [!client-boundary]";

export const defaults: Required<Options> = {
  color: "hsla(0, 0%, 100%, 1)",
  segments: 40,
  height: 20,
  minSegmentWidth: 12,
  strokeWidth: 9,
  strokeDasharray: "none",
  peakSmoothness: 0,
  verticalPadding: 4,
  class: "",
};

export function transformerClientBoundary(
  options: Options = {},
): ShikiTransformer {
  let mergedOptions: Required<Options> = {
    ...defaults,
    ...options,
  };

  let color = mergedOptions.color;
  let padding = mergedOptions.verticalPadding;

  return {
    name: "@twofold/shiki-transformer-client-boundary",
    preprocess(code) {
      let lines = code.split("\n");
      let out: string[] = [];
      let removeIgnores = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i] ?? "";
        let ignoreLine =
          removeIgnores &&
          (line.trim() === "// prettier-ignore" || line.trim() === "");

        if (!ignoreLine) {
          out.push(line);
        }

        if (removeIgnores && line.trim() !== "") {
          removeIgnores = false;
        }

        if (line.trim() === TOKEN) {
          removeIgnores = true;
        }
      }

      return out.join("\n");
    },

    line(node) {
      if (
        node.type === "element" &&
        node.children.length === 1 &&
        node.children[0] &&
        node.children[0].type === "element" &&
        node.children[0].children.length === 1 &&
        node.children[0].children[0] &&
        node.children[0].children[0].type === "text" &&
        node.children[0].children[0].value.trim() === TOKEN
      ) {
        node.type = "element";
        node.tagName = "div";
        node.properties = {
          class: ["client-component-boundary", mergedOptions.class]
            .join(" ")
            .trim(),
          style: [
            "position: relative;",
            `height: ${mergedOptions.height + padding * 2}px;`,
            "overflow-x: hidden;",
          ].join(" "),
        };
        node.children = [
          {
            type: "element",
            tagName: "div",
            properties: {
              style: [
                color ? `color: ${color};` : "",
                padding ? `padding: ${padding}px 0;` : "",
                "position: absolute;",
                "width: 100%;",
                "top: 0;",
                "left: 0;",
                "right: 0;",
                "border: 0;",
              ].join(" "),
            },
            children: [
              {
                type: "element",
                tagName: "svg",
                properties: {
                  viewBox: generateViewBox(mergedOptions),
                  preserveAspectRatio: "none",
                  style: [
                    "width: 100%;",
                    `min-width: ${mergedOptions.minSegmentWidth * mergedOptions.segments}px;`,
                    `height: ${mergedOptions.height}px;`,
                  ].join(" "),
                  fill: "none",
                },
                children: [
                  {
                    type: "element",
                    tagName: "path",
                    properties: {
                      d: generateZigZagPath(mergedOptions),
                      stroke: "currentColor",
                      fill: "none",
                      "stroke-linecap": "square",
                      "stroke-width": mergedOptions.strokeWidth,
                      "stroke-dasharray": mergedOptions.strokeDasharray,
                      "vector-effect": "non-scaling-stroke",
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        ];
      }
    },
  };
}

function calculateAmplitude(options: Required<Options>) {
  return options.height;
}

function calculateFrequency(options: Required<Options>) {
  let targetWidth = Math.max(options.minSegmentWidth, 1) * options.segments;
  return targetWidth / options.segments;
}

function generateZigZagPath(options: Required<Options>) {
  let frequency = calculateFrequency(options);
  let amplitude = calculateAmplitude(options);
  let bottomY = options.height;

  let firstSegmentStartX = -0.5 * frequency;
  let firstSegmentStartY = bottomY; // Start at bottom
  let path = `M${firstSegmentStartX},${firstSegmentStartY}`;

  for (let i = 0; i < options.segments; i++) {
    let x0 = (i - 0.5) * frequency;
    let y0 = i % 2 === 1 ? bottomY - amplitude : bottomY;
    let x1 = (i + 0.5) * frequency;
    let y1 = i % 2 === 1 ? bottomY : bottomY - amplitude;

    if (options.peakSmoothness === 0) {
      // main diagonal segment using quadratic Bezier (no cap in path anymore)
      let midX = (x0 + x1) / 2;
      let midY = (y0 + y1) / 2;
      path += ` Q${midX},${midY} ${x1},${y1}`;
    } else {
      let cpOffset = (x1 - x0) * 0.5 * options.peakSmoothness;
      path += ` C${x0 + cpOffset},${y0} ${x1 - cpOffset},${y1} ${x1},${y1}`;
    }
  }

  return path;
}

function generateViewBox(options: Required<Options>) {
  let frequency = calculateFrequency(options);
  let width = options.segments * frequency;
  let verticalPadding = options.strokeWidth * 2;

  let x = -0.5 * frequency;
  let y = -verticalPadding;
  let viewBoxWidth = width;
  let viewBoxHeight = options.height + 2 * verticalPadding;

  return `${x} ${y} ${viewBoxWidth} ${viewBoxHeight}`;
}
