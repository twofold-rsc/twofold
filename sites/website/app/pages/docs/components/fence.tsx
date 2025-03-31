import { codeToHtml } from "shiki";
import { transformerNotationDiff } from "@shikijs/transformers";

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
    <div className="not-prose my-6 overflow-x-scroll rounded-md bg-[#24292e] text-sm font-medium [&_pre]:leading-[1.7]">
      <div className="relative inline-block w-max min-w-full p-4">
        <div dangerouslySetInnerHTML={{ __html: result }} className="" />
        <div className="pointer-events-none absolute inset-0 rounded-md ring ring-white/20 ring-inset" />
      </div>
    </div>
  );
}
