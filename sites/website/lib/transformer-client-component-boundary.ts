import { ShikiTransformer } from "shiki";

type Options = {
  color?: string;
  class?: string;
  segments?: number;
  height?: number;
  strokeWidth?: number;
  peakSmoothness?: number;
  padding?: number;
};

const TOKEN = "// ![client-boundary]";

const defaults: Required<Options> = {
  color: "currentColor", // use a tailwind color here
  class: "",
  segments: 40,
  height: 16,
  strokeWidth: 1,
  peakSmoothness: 0.75,
  padding: 4,
};

export function transformerClientComponentBoundary(
  options: Options = {},
): ShikiTransformer {
  let color = options.color;

  let mergedOptions: Required<Options> = {
    ...defaults,
    ...options,
  };

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
              viewBox: generateViewBox(mergedOptions),
              preserveAspectRatio: "none",
              style: "width: 100%; height: 100%;",
              fill: "none",
            },
            children: [
              {
                type: "element",
                tagName: "path",
                properties: {
                  d: generateZigZagPath(mergedOptions),
                  stroke: "currentColor",
                  "stroke-width": generateStrokeWidth(mergedOptions),
                  "stroke-linecap": "square",
                  // "stroke-linecap":
                  //   mergedOptions.peakSmoothness === 0 ? "square" : "round",
                },
                children: [],
              },
              ...(mergedOptions.peakSmoothness === 0
                ? [generateStartLineCap(mergedOptions)]
                : []),
            ],
          },
        ];
      }
    },
  };
}

function calculateAmplitude(options: Required<Options>) {
  // Calculate amplitude from height, accounting for padding
  // The amplitude is half the usable height (since zigzag goes from 0 to -amplitude)
  return (options.height - options.padding * 2) / 2;
}

function calculateFrequency(options: Required<Options>) {
  // Calculate frequency based on a target total width that creates good visual balance
  // We want the total width to have a reasonable aspect ratio with the height
  // Use a target aspect ratio to determine total width, then divide by segments
  let targetWidth = options.height * 8; // 8:1 aspect ratio for good visual balance
  return targetWidth / options.segments;
}

function generateStrokeWidth(options: Required<Options>) {
  return options.strokeWidth;
}

function generateZigZagPath(options: Required<Options>) {
  let frequency = calculateFrequency(options);
  let amplitude = calculateAmplitude(options);

  let path = `M0,0`;

  for (let i = 0; i < options.segments; i++) {
    let x0 = i * frequency;
    let y0 = i % 2 === 0 ? 0 : -amplitude;
    let x1 = (i + 1) * frequency;
    let y1 = i % 2 === 0 ? -amplitude : 0;

    if (options.peakSmoothness === 0) {
      path += ` L${x1},${y1}`;
    } else {
      let cpOffset = (x1 - x0) * 0.5 * options.peakSmoothness;
      path += ` C${x0 + cpOffset},${y0} ${x1 - cpOffset},${y1} ${x1},${y1}`;
    }
  }

  return path;
}

function generateViewBox(options: Required<Options>) {
  let frequency = calculateFrequency(options);
  let amplitude = calculateAmplitude(options);

  // Width should be exactly what the path covers: segments * frequency
  let width = options.segments * frequency;

  // For zigzag lines, the stroke extends perpendicular to the line direction
  // At the peaks/valleys, we need to account for the stroke extending in the
  // direction perpendicular to the diagonal line
  let lineAngle = Math.atan2(amplitude, frequency);
  let strokeExtension = options.strokeWidth / 2 / Math.sin(lineAngle);

  // Use a simpler approach: just use a generous multiplier of the stroke width
  // This accounts for the diagonal nature and line caps
  let padding = options.strokeWidth * 1.5;

  // Height should fit the zigzag line plus stroke padding
  let y = -amplitude - padding;
  let height = amplitude + 2 * padding;

  // Width should include padding for line caps and diagonal stroke extension
  let x = -padding;
  let viewBoxWidth = width + 2 * padding;

  return `${x} ${y} ${viewBoxWidth} ${height}`;
}

function generateStartLineCap(options: Required<Options>) {
  let frequency = calculateFrequency(options);
  let amplitude = calculateAmplitude(options);
  let strokeWidth = options.strokeWidth;

  // The line starts at (0,0) and goes to (frequency, -amplitude)
  // Calculate the direction vector and normalize it
  let dx = frequency;
  let dy = -amplitude;
  let length = Math.sqrt(dx * dx + dy * dy);
  let unitX = dx / length;
  let unitY = dy / length;

  // Calculate perpendicular vector for the width of the cap
  let perpX = -unitY;
  let perpY = unitX;

  // Cap dimensions - create a right triangle with fixed hypotenuse length
  // C (hypotenuse) always equals strokeWidth
  // A and B adjust based on line angle to maintain the right triangle
  let hypotenuseLength = strokeWidth;

  // Calculate A and B lengths based on line angle
  // A = strokeWidth * sin(angle), B = strokeWidth * cos(angle)
  let sideA = hypotenuseLength * Math.abs(unitX); // vertical side length
  let sideB = hypotenuseLength * Math.abs(unitY); // horizontal side length

  // Create a right triangle with perfectly straight sides
  // Adjust positioning to account for stroke width AND line direction
  let halfStroke = strokeWidth / 2;

  // Calculate stroke offset in the perpendicular direction
  let strokeOffsetX = perpX * halfStroke;
  let strokeOffsetY = perpY * halfStroke;

  // Point 1: Bottom-left corner (the right angle vertex)
  let point1X = -sideB + strokeOffsetX;
  let point1Y = strokeOffsetY;

  // Point 2: Top-left corner (end of side A)
  let point2X = -sideB + strokeOffsetX;
  let point2Y = -sideA + strokeOffsetY;

  // Point 3: Bottom-right corner (end of side B, start of hypotenuse C)
  let point3X = 0 + strokeOffsetX;
  let point3Y = 0 + strokeOffsetY;

  return {
    type: "element" as const,
    tagName: "polygon",
    properties: {
      points: `${point1X},${point1Y} ${point2X},${point2Y} ${point3X},${point3Y}`,
      fill: "red",
    },
    children: [],
  };
}
