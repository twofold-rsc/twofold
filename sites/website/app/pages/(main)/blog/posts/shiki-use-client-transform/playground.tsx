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

let defaultOptions = {
  ...defaults,
  padding: 8,
  class: "-mx-4",
};

export function Provider({ children }: { children: ReactNode }) {
  let [selectedPreset, setSelectedPreset] = useState("default");
  let [options, setOptions] = useState<Options>(defaultOptions);

  function updateOptions(newOptions: Partial<Options>) {
    setOptions((current) => ({ ...current, ...newOptions }));
  }

  function setPreset(preset: string) {
    setSelectedPreset(preset);
    switch (preset) {
      case "line-tear":
        updateOptions({
          ...defaults,
          peakSmoothness: 0,
          segments: 40,
          height: 20,
          strokeWidth: 2,
          color: "white",
          class: "-mx-4",
        });
        break;
      case "dashed":
        updateOptions({
          ...defaults,
          peakSmoothness: 0,
          segments: 2,
          height: 2,
          verticalPadding: 13,
          strokeWidth: 2,
          strokeDasharray: "12,10.1",
          color: "rgb(158 203 255 / 90%)",
          class: "-mx-4",
        });
        break;
      case "sine-wave":
        updateOptions(defaultOptions);
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

    // ![client-boundary]

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

    // ![client-boundary]

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
      <div className="grid grid-cols-3">
        <label>Color</label>
        <input
          type="color"
          value={options.color}
          onChange={(e) =>
            updateOptions({
              color: e.target.value,
            })
          }
        />
        <div>
          <div>{options.color}</div>
        </div>

        <label>Segments</label>
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
        />
        <div>
          <div>{options.segments}</div>
        </div>

        <label>Height</label>
        <input
          type="range"
          min="2"
          max="40"
          step="1"
          value={options.height}
          onChange={(e) =>
            updateOptions({
              height: Number(e.target.value),
            })
          }
        />
        <div>
          <div>{options.height}</div>
        </div>

        <label>Stroke width</label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={options.strokeWidth}
          onChange={(e) =>
            updateOptions({
              strokeWidth: Number(e.target.value),
            })
          }
        />
        <div>
          <div>{options.strokeWidth}</div>
        </div>

        <label>Peak smoothness</label>
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
        />
        <div>
          <div>{options.peakSmoothness}</div>
        </div>

        <label>Vertical padding</label>
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
        />
        <div>
          <div>{options.verticalPadding}</div>
        </div>
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
