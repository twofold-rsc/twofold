"use client";

import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import githubDarkTheme from "shiki/themes/github-dark.mjs";
import javascriptLanguage from "shiki/langs/jsx.mjs";
import { startTransition, use, useState } from "react";
import clsx from "clsx";
import dedent from "dedent";
import { transformerClientComponentBoundary } from "@lib/transformer-client-component-boundary";

let highlighterPromise = createHighlighterCore({
  themes: [githubDarkTheme],
  langs: [javascriptLanguage],
  engine: createJavaScriptRegexEngine(),
});

export function ThemeExamples() {
  let [options, setOptions] = useState({
    color: "white",
    class: "",
    segments: 40,
    peakSmoothness: 0,
  });

  let highlighter = use(highlighterPromise);

  let result = highlighter.codeToHtml(
    dedent`
    function ServerComponent() {}

    // ![client-boundary]

    function ClientComponent() {}
    `,
    {
      lang: "jsx",
      theme: "github-dark",
      transformers: [transformerClientComponentBoundary(options)],
    },
  );

  function updateOptions(newOptions: Partial<typeof options>) {
    startTransition(() => {
      setOptions((current) => ({ ...current, ...newOptions }));
    });
  }

  return (
    <div className="not-prose -mx-3 my-6 sm:mx-0">
      <div>
        <button
          onClick={() =>
            updateOptions({
              color: "red",
              peakSmoothness: 0,
            })
          }
        >
          Zig zags
        </button>

        <button
          onClick={() =>
            updateOptions({
              color: "currentColor",
              class: "text-red-500",
              peakSmoothness: 0.75,
            })
          }
        >
          Waves
        </button>
      </div>
      <div className="grid grid-cols-4">
        <label>Segments</label>

        <input
          type="range"
          min="4"
          max="80"
          step="2"
          onChange={(e) =>
            updateOptions({
              segments: Number(e.target.value),
            })
          }
        />
        <div>
          <div>{options.segments}</div>
        </div>
      </div>
      <div
        className={clsx(
          "mt-4",
          "overflow-x-scroll bg-[#24292e] text-sm font-medium [&_pre]:text-[13px] [&_pre]:leading-[1.7] [&_pre]:subpixel-antialiased",
          "rounded-md",
        )}
      >
        <div className="relative inline-block w-max min-w-full p-4">
          <div dangerouslySetInnerHTML={{ __html: result }} className="" />
        </div>
      </div>
    </div>
  );
}
