import { getHighlighter } from "shiki";
import Counter from "./counter";
import { readFile } from "fs/promises";
import path from "path";
import ServerAction from "./server-action";

export default async function Page() {
  let rows = 10;
  let cols = 25;

  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  let counterCode = await getCounterCode();

  return (
    <div className="relative">
      <section className="max-w-7xl px-6 pt-20 mx-auto">
        <div className="z-0 absolute inset-0 grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px bg-gray-200 p-px h-[40vw]">
          {grid.map((row, i) =>
            row.map((_, j) => (
              <div key={`${i}_${j}`} className="bg-white"></div>
            ))
          )}
        </div>
        <div className="z-10 relative">
          <div className="max-w-prose">
            <h1 className="text-7xl font-black tracking-tighter">
              Twofold RSC
            </h1>
            <p className="mt-1 leading-relaxed text-gray-800 font-medium tracking-tight text-3xl">
              Twofold is a framework for building web applications with React
              Server Components, Tailwind, and TypeScript.
            </p>
          </div>

          <div className="flex space-x-16 mt-16">
            <div className="w-[300px] shrink-0">
              <div className="bg-white p-4 rounded border border-gray-300 shadow">
                <ServerAction />
              </div>
            </div>
          </div>

          <div className="flex space-x-16 mt-16">
            <div className="w-[300px] shrink-0">
              <div className="bg-white p-4 rounded border border-gray-300 shadow">
                <Counter />
              </div>
            </div>
            <div
              className="p-4 bg-[#292D3E] overflow-scroll rounded-md shadow-md text-sm"
              dangerouslySetInnerHTML={{ __html: counterCode }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

let cache = new Map<string, string>();

async function getCounterCode() {
  let result = cache.get("counter");

  if (!result) {
    let counterContents = await readFile(
      path.join(process.cwd(), "src/pages/counter.tsx"),
      {
        encoding: "utf-8",
      }
    );

    let highlighter = await getHighlighter({
      theme: "material-theme-palenight",
    });

    result = highlighter.codeToHtml(counterContents, {
      lang: "tsx",
    });

    cache.set("counter", result);
  }

  return result;
}
