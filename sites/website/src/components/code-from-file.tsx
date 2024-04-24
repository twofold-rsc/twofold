import { readFile } from "fs/promises";
import path from "path";
import { codeToHtml } from "shiki";

let cache = new Map<string, string>();

async function getCode(file: string) {
  let result = cache.get(file);

  if (!result) {
    let contents = await readFile(path.join(process.cwd(), file), {
      encoding: "utf-8",
    });

    // console.log(contents);

    result = await codeToHtml(contents, {
      lang: "tsx",
      theme: "material-theme-palenight",
    });

    cache.set(file, result);
  }

  return result;
}

export async function CodeFromFile({ file }: { file: string }) {
  let code = await getCode(file);

  return (
    <div
      className="p-8 bg-[#292D3E] [&_pre]:overflow-x-scroll [&_code_.line]:inline-block [&_code_.line]:my-[1px] text-sm"
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
