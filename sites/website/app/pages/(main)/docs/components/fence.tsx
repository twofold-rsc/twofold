import { codeToHtml } from "shiki";
import { transformerNotationDiff } from "@shikijs/transformers";
import clsx from "clsx";

export async function Fence({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  let result = await codeToHtml(children, {
    lang: language,
    theme: "github-dark", // #24292e
    // theme: "github-dark-default", // #0d1117
    // theme: "night-owl", // #011627
    transformers: [transformerNotationDiff()],
  });

  return (
    <div
      className={clsx(
        "not-prose my-6 overflow-x-scroll rounded-md bg-[#24292e] text-sm shadow-md ring shadow-black/20 ring-slate-950/10",
        "[&_pre]:text-[13px] [&_pre]:leading-[1.7] [&_pre]:subpixel-antialiased",
      )}
    >
      <div className="inline-block w-max min-w-full p-4">
        <div dangerouslySetInnerHTML={{ __html: result }} className="" />
      </div>
    </div>
  );
}
