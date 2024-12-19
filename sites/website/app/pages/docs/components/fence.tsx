import { codeToHtml } from "shiki";

export async function Fence({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  let result = await codeToHtml(children, {
    lang: language,
    theme: "dracula",
  });

  return <div dangerouslySetInnerHTML={{ __html: result }} />;
}
