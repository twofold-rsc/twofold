import { ShikiTransformer } from "shiki";

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

export function transformerClientComponentBoundary(
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
        let line = lines[i];
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
        node.children[0].type === "element" &&
        node.children[0].children.length === 1 &&
        node.children[0].children[0].type === "text" &&
        node.children[0].children[0].value === TOKEN
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
                      "stroke-width": generateStrokeWidth(mergedOptions),
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function calculateAmplitude(options: Required<Options>) {
  // Calculate amplitude from height, accounting for padding
  // The amplitude is half the usable height (since zigzag goes from 0 to -amplitude)

  // let height = clamp(options.height, options.padding * 2, options.height);

  // console.log("options.height", options.height);
  // console.log("options.padding", options.padding);
  // console.log("height", height);

  // let amplitude = (height - options.padding * 2) / 2;

  // console.log("amplitude", amplitude);

  // return amplitude;

  return options.height;
}

function calculateFrequency(options: Required<Options>) {
  // Calculate frequency based on a target total width that creates good visual balance
  // We want the total width to have a reasonable aspect ratio with the height
  // Use a target aspect ratio to determine total width, then divide by segments

  let targetWidth = options.height * 8; // 8:1 aspect ratio for good visual balance
  return targetWidth / options.segments;

  // return options.segments;
}

function generateStrokeWidth(options: Required<Options>) {
  return options.strokeWidth;
}

function generateZigZagPath(options: Required<Options>) {
  let frequency = calculateFrequency(options);
  let amplitude = calculateAmplitude(options);

  let bottomY = options.height;

  // Start from the beginning of the first segment at the bottom
  let firstSegmentStartX = -0.5 * frequency;
  let firstSegmentStartY = bottomY; // Start at bottom
  let path = `M${firstSegmentStartX},${firstSegmentStartY}`;

  for (let i = 0; i < options.segments; i++) {
    let x0, y0, x1, y1;

    // Regular segments
    x0 = (i - 0.5) * frequency;
    y0 = i % 2 === 1 ? bottomY - amplitude : bottomY;
    x1 = (i + 0.5) * frequency;
    y1 = i % 2 === 1 ? bottomY : bottomY - amplitude;

    if (options.peakSmoothness === 0) {
      // Main diagonal segment using quadratic Bezier (no cap in path anymore)
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
  let strokeWidth = generateStrokeWidth(options);

  // Width should cover from the start of first segment to end of last segment
  let width = options.segments * frequency;

  // Add generous vertical padding to account for stroke width
  // Use the adjusted stroke width plus a safety margin to ensure no cropping
  let verticalPadding = Math.max(
    strokeWidth * 2, // At least the full adjusted stroke width
    options.strokeWidth * 2, // Or twice the base stroke width as a minimum
  );

  // Height should fit the zigzag line plus stroke padding on both sides
  let height = options.height + 2 * verticalPadding;
  let y = -verticalPadding;

  // console.log("adjustedStrokeWidth", strokeWidth);
  // console.log("*2 strokeWidth", options.strokeWidth * 2);
  // console.log("verticalPadding", verticalPadding);
  // console.log("height", height);

  // ViewBox should start from where the path starts
  let x = -0.5 * frequency;
  let viewBoxWidth = width;

  return `${x} ${y} ${viewBoxWidth} ${height}`;
}
