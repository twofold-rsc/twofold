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
    peakSmoothness: 0,
    segments: 40,
    height: 20,
    strokeWidth: 8,
    color: "hsla(0, 0%, 100%, 1)",
    class: "-mx-4",
  },
  dashed: {
    ...defaults,
    peakSmoothness: 0,
    segments: 2,
    height: 2,
    verticalPadding: 13,
    strokeWidth: 2,
    strokeDasharray: "12,10.1",
    color: "hsla(212, 100%, 81%, 0.8)",
    class: "-mx-4",
  },
  sineWave: {
    ...defaults,
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
      case "dashed":
        updateOptions(configs.dashed);
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

    function ClientComponent() {}
  `;

  return <CodeBlock code={code} />;
}

export function Presets() {
  const { setPreset, selectedPreset } = use(ThemeContext);

  return (
    <div className="not-prose flex items-center gap-4">
      <button
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        onClick={() => setPreset("line-tear")}
      >
        Line tear
      </button>

      <button
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        onClick={() => setPreset("dashed")}
      >
        Dashed line
      </button>

      <button
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        onClick={() => setPreset("sine-wave")}
      >
        Sine wave
      </button>
    </div>
  );
}

export function Playground() {
  let { options, updateOptions } = use(ThemeContext);

  return (
    <div className="not-prose my-6">
      <div className="space-y-5 sm:space-y-3">
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="sm:w-1/2">
            <label className="block font-medium">Color</label>
            <p className="text-sm text-gray-500">
              The color of the line. You can use any valid CSS color value.
            </p>
          </div>
          <div className="sm:w-1/2">
            <div className="flex w-full items-center space-x-2 sm:mt-1">
              <ColorPicker
                value={options.color ?? defaults.color}
                onChange={(color) => {
                  updateOptions({
                    color,
                  });
                }}
              />
              <div className="font-mono text-xs">{options.color}</div>
            </div>
          </div>
        </div>

        <label>Segments</label>
        <div className="flex w-full items-center justify-center">
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
        </div>
        <div>
          <div>{options.segments}</div>
        </div>

        <label>Height</label>
        <div className="flex w-full items-center justify-center">
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
        </div>
        <div>
          <div>{options.height}</div>
        </div>

        <label>Stroke width</label>
        <div className="flex w-full items-center justify-center">
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
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((Number(options.strokeWidth) - 1) / (8 - 1)) * 100}%, #e5e7eb ${((Number(options.strokeWidth) - 1) / (8 - 1)) * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>
        <div>
          <div>{options.strokeWidth}</div>
        </div>

        <label>Peak smoothness</label>
        <div className="flex w-full items-center justify-center">
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
        </div>
        <div>
          <div>{options.peakSmoothness}</div>
        </div>

        <label>Vertical padding</label>
        <div className="flex w-full items-center justify-center">
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
        </div>
        <div>
          <div>{options.verticalPadding}</div>
        </div>
      </div>
      <div className="mt-6">
        <Presets />
      </div>
      <BasicExample />
    </div>
  );
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
        "not-prose my-6",
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
