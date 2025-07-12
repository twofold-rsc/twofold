"use client";

import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import githubDarkTheme from "shiki/themes/github-dark.mjs";
import javascriptLanguage from "shiki/langs/jsx.mjs";
import {
  createContext,
  ReactNode,
  startTransition,
  use,
  useState,
} from "react";
import clsx from "clsx";
import dedent from "dedent";
import {
  transformerClientComponentBoundary,
  Options,
  defaults,
} from "@lib/transformer-client-component-boundary";
import { ColorPicker } from "./color-picker";

const ThemeContext = createContext<{
  options: Options;
  updateOptions: (newOptions: Partial<Options>) => void;
  setPreset: (preset: string) => void;
  selectedPreset?: string;
}>({
  options: {},
  updateOptions: () => {},
  setPreset: () => {},
  selectedPreset: "default",
});

const configs: Record<string, Options> = {
  lineTear: {
    ...defaults,
    class: "-mx-4",
  },
  sineWave: {
    ...defaults,
    color: "hsla(210, 5%, 33%, 1)",
    height: 14,
    segments: 50,
    minSegmentWidth: 8,
    strokeWidth: 2.5,
    peakSmoothness: 0.7,
    verticalPadding: 7,
    class: "-mx-4",
  },
};

export function Provider({ children }: { children: ReactNode }) {
  let [selectedPreset, setSelectedPreset] = useState("lineTear");
  let [options, setOptions] = useState<Options>(configs.lineTear);

  function updateOptions(newOptions: Partial<Options>) {
    startTransition(() => {
      setOptions((current) => ({ ...current, ...newOptions }));
    });
  }

  function setPreset(preset: string) {
    setSelectedPreset(preset);
    switch (preset) {
      case "line-tear":
        updateOptions(configs.lineTear);
        break;
      case "sine-wave":
        updateOptions(configs.sineWave);
        break;
      default:
        throw new Error(`Unknown preset: ${preset}`);
    }
  }

  return (
    <ThemeContext
      value={{
        options,
        updateOptions,
        setPreset,
        selectedPreset,
      }}
    >
      {children}
    </ThemeContext>
  );
}

export function OpeningExample() {
  let code = dedent`
    import { ClientComponent } from "./client-component";

    export function ServerComponent() {
      return (
        <div>
          <h1>Server Component</h1>
          <ClientComponent />
        </div>
      );
    }

    // [!client-boundary]

    "use client";

    import { useState } from "react";

    export function ClientComponent() {
      const [count, setCount] = useState(0);

      return (
        <div>
          <div>Client Component count: {count}</div>
          <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        </div>
      );
    }`.trim();

  return <CodeBlock code={code} />;
}

export function BasicExample() {
  let code = dedent`
    function ServerComponent() {}

    // [!client-boundary]

    "use client";

    function ClientComponent() {}
  `;

  return (
    <div className="not-prose my-6">
      <CodeBlock code={code} />
    </div>
  );
}

export function Presets() {
  const { setPreset } = use(ThemeContext);

  return (
    <div className="not-prose my-6 flex items-center gap-2.5 sm:gap-3">
      <button
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 sm:px-3 sm:text-sm"
        onClick={() => setPreset("line-tear")}
      >
        Line tear
      </button>

      <button
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 sm:px-3 sm:text-sm"
        onClick={() => setPreset("sine-wave")}
      >
        Sine wave
      </button>
    </div>
  );
}

export function Playground() {
  let { setPreset, options, updateOptions } = use(ThemeContext);

  let code = dedent`
    import { ClientComponent } from "./client-component";

    function ServerComponent() {
      return (
        <div>
          <h1>Server Component</h1>
          <ClientComponent />
        </div>
      );
    }

    // [!client-boundary]

    "use client";

    import { useState } from "react";

    export function ClientComponent() {
      const [count, setCount] = useState(0);

      return (
        <div>
          <p>Client Component count: {count}</p>

          <button onClick={() => setCount((c) => c + 1)}>
            Increment
          </button>
        </div>
      );
    }
  `;

  return (
    <div className="not-prose my-8 xl:-mx-48 xl:mt-16 xl:mb-24 xl:flex xl:space-x-14">
      <div className="space-y-5 xl:mt-2 xl:w-1/2 xl:space-y-6.5">
        <div>
          <label className="block font-medium">Preset styles</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                Style the example with a preset style.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex items-center justify-end gap-2.5">
                <button
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                  onClick={() => setPreset("line-tear")}
                >
                  Line tear
                </button>

                <button
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                  onClick={() => setPreset("sine-wave")}
                >
                  Sine wave
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Color</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                The color of the line. You can use any valid CSS color value.
              </p>
            </div>
            <div className="w-1/2">
              <div className="flex w-full items-center space-x-2 sm:justify-end">
                <div className="font-mono text-xs">{options.color}</div>
                <ColorPicker
                  value={options.color ?? defaults.color}
                  onChange={(color) => {
                    updateOptions({
                      color,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Segments</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                The number of segments to draw.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex w-full items-center space-x-2">
                <input
                  type="range"
                  min="2"
                  max="80"
                  step="2"
                  value={options.segments}
                  onChange={(e) =>
                    updateOptions({
                      segments: Number(e.target.value),
                    })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((Number(options.segments) - 2) / (80 - 2)) * 100}%, #e5e7eb ${((Number(options.segments) - 2) / (80 - 2)) * 100}%, #e5e7eb 100%)`,
                  }}
                />

                <div className="min-w-[30px] text-right font-mono text-sm">
                  {options.segments}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Minimum segment width</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                Keeps each segment from becoming too narrow.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex w-full items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={options.minSegmentWidth}
                  onChange={(e) =>
                    updateOptions({
                      minSegmentWidth: Number(e.target.value),
                    })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(Number(options.minSegmentWidth) / 16) * 100}%, #e5e7eb ${(Number(options.minSegmentWidth) / 16) * 100}%, #e5e7eb 100%)`,
                  }}
                />

                <div className="min-w-[30px] text-right font-mono text-sm">
                  {options.minSegmentWidth}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Height</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                The height of the line in pixels.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex w-full items-center space-x-2">
                <input
                  type="range"
                  min="2"
                  max="36"
                  step="1"
                  value={options.height}
                  onChange={(e) =>
                    updateOptions({
                      height: Number(e.target.value),
                    })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((Number(options.height) - 2) / (36 - 2)) * 100}%, #e5e7eb ${((Number(options.height) - 2) / (36 - 2)) * 100}%, #e5e7eb 100%)`,
                  }}
                />

                <div className="min-w-[30px] text-right font-mono text-sm">
                  {options.height}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Stroke width</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                Controls the thickness of the line.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex w-full items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="8.0"
                  step="0.5"
                  value={options.strokeWidth}
                  onChange={(e) =>
                    updateOptions({
                      strokeWidth: Number(e.target.value),
                    })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((Number(options.strokeWidth) - 1) / (8 - 1.0)) * 100}%, #e5e7eb ${((Number(options.strokeWidth) - 1) / (8 - 1.0)) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="min-w-[30px] text-right font-mono text-sm">
                  {options.strokeWidth?.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Peak smoothness</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                Controls the sharpness of the tips in the waveform.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex w-full items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={options.peakSmoothness}
                  onChange={(e) =>
                    updateOptions({
                      peakSmoothness: Number(e.target.value),
                    })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${Number(options.peakSmoothness) * 100}%, #e5e7eb ${Number(options.peakSmoothness) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="min-w-[30px] text-right font-mono text-sm">
                  {options.peakSmoothness?.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Vertical padding</label>
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-32 xl:space-x-10">
            <div className="sm:w-1/2">
              <p className="text-sm text-gray-500">
                Adds breathing room around the line.
              </p>
            </div>
            <div className="sm:w-1/2">
              <div className="flex w-full items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={options.verticalPadding}
                  onChange={(e) =>
                    updateOptions({
                      verticalPadding: Number(e.target.value),
                    })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(Number(options.verticalPadding) / 16) * 100}%, #e5e7eb ${(Number(options.verticalPadding) / 16) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="min-w-[30px] text-right font-mono text-sm">
                  {options.verticalPadding}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mt-8 xl:mt-0 xl:w-1/2">
        <div className="xl:absolute xl:inset-0">
          <CodeBlock code={code} />
        </div>
      </div>
    </div>
  );
}

export function PlaygroundConfig() {
  let { options } = use(ThemeContext);

  let x = Object.entries(options)
    .filter(([key]) => key !== "class" && key !== "strokeDasharray")
    .map(([key, value]) => `      ${key}: ${JSON.stringify(value)}`)
    .join(",\n");

  let code = `const code = await codeToHtml("...", {
  lang: "jsx",
  transformers: [
    transformerClientBoundary({
${x},

      // Any additional CSS classes you'd like to apply to the boundary.
      // This is useful for styling the boundary in your own way.
      class: "",
    })
  ],
});`;

  return <CodeBlock code={code} />;
}

let highlighterPromise = createHighlighterCore({
  themes: [githubDarkTheme],
  langs: [javascriptLanguage],
  engine: createJavaScriptRegexEngine(),
});

function CodeBlock({ code }: { code: string }) {
  let highlighter = use(highlighterPromise);
  let { options } = use(ThemeContext);

  let result = highlighter.codeToHtml(code, {
    lang: "jsx",
    theme: "github-dark",
    transformers: [transformerClientComponentBoundary(options)],
  });

  return (
    <div
      className={clsx(
        "not-prose",
        "overflow-x-scroll bg-[#24292e] text-sm font-medium [&_pre]:text-[13px] [&_pre]:leading-[1.7] [&_pre]:subpixel-antialiased",
        "rounded-md",
      )}
    >
      <div className="relative inline-block w-max min-w-full p-4">
        <div
          dangerouslySetInnerHTML={{ __html: result }}
          /* bug in safari */
          suppressHydrationWarning
          className=""
        />
      </div>
    </div>
  );
}
