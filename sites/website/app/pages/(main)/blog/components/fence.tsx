import { codeToHtml, ShikiTransformer } from "shiki";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import clsx from "clsx";
import { transformerClientBoundary } from "@/lib/shiki-transformer-client-boundary";

export async function Fence({
  children,
  language,
  file,
  demo,
  tabs,
}: {
  children: string;
  language: string;
  file?: string;
  demo?: boolean;
  tabs?: { isFirst: boolean };
}) {
  let result = await codeToHtml(children, {
    lang: language,
    theme: "github-dark", // #24292e
    // theme: "github-dark-default", // #0d1117
    // theme: "night-owl", // #011627
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
      transformerClientBoundary({
        color: "currentColor",
        segments: 50,
        height: 12,
        minSegmentWidth: 8,
        strokeWidth: 2.5,
        peakSmoothness: 0.7,
        verticalPadding: 8,
        class: "-mx-4 text-slate-50/20",
      }),
    ],
  });

  const hasTabs = !!tabs;

  return (
    <div
      className={clsx(
        "not-prose -mx-2 sm:mx-0",
        demo ? "mt-6" : hasTabs ? "mb-6" : "my-6",
      )}
    >
      {file && (
        <div className="flex items-center justify-start">
          <div className="inline-flex items-center justify-center rounded-t-md bg-[#24292e] px-4 pt-2 pb-1 text-xs font-medium text-gray-300">
            {file}
          </div>
        </div>
      )}
      <div
        className={clsx(
          "overflow-x-scroll bg-[#24292e] text-sm font-medium [&_pre]:text-[13px] [&_pre]:leading-[1.7] [&_pre]:subpixel-antialiased",
          !file && !demo && !hasTabs && "rounded-md",
          file && demo && "rounded-tr-md",
          hasTabs && !tabs.isFirst && "rounded-tl-md",
          (file || hasTabs) && !demo && "rounded-tr-md rounded-b-md",
          !file && demo && "rounded-t-md",
        )}
      >
        <div className="relative inline-block w-max min-w-full p-4">
          <div dangerouslySetInnerHTML={{ __html: result }} className="" />
        </div>
      </div>
    </div>
  );
}
