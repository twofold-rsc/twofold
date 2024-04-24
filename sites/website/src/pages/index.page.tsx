import { CodeFromFile } from "../components/code-from-file";
import Counter from "./counter";
import { ServerActionPoll } from "./server-action-poll";

export default async function Page() {
  let rows = 10;
  let cols = 25;

  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  return (
    <div>
      <section className="relative">
        <div className="max-w-7xl px-6 py-32 mx-auto">
          <div className="z-0 absolute inset-0 grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px bg-gray-100 p-px">
            {grid.map((row, i) =>
              row.map((_, j) => (
                <div key={`${i}_${j}`} className="bg-white"></div>
              )),
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
          </div>
        </div>
      </section>

      <section>
        <div>
          <div className="flex">
            <div className="w-2/5 flex items-center justify-center relative">
              <GridLines rows={50} cols={25} color="blue" />
              <div className="z-10">
                <h2 className="text-blue-400 text-6xl tracking-tighter font-bold text-center caveat-font">
                  Server Actions
                </h2>
                <div className="min-w-[380px] mt-12 bg-white p-6 rounded border border-blue-300 shadow-lg">
                  <ServerActionPoll />
                </div>
              </div>
            </div>
            <div className="w-3/5 bg-[#292D3E]">
              <CodeFromFile file="src/pages/server-action-poll.tsx" />
            </div>
          </div>

          <div className="flex">
            <div className="w-1/2 bg-[#292D3E]">
              {/* <CodeFromFile file="src/pages/server-action-poll.tsx" /> */}
            </div>

            <div className="w-1/2 flex items-center justify-center relative">
              <GridLines rows={50} cols={25} color="blue" />
              <div className="z-10">
                <h2 className="text-blue-400 text-6xl tracking-tighter font-bold text-center caveat-font">
                  Layouts
                </h2>
                <div className="mt-12 bg-white p-6 rounded border border-blue-300 shadow-lg">
                  <iframe src="/examples/email-client" />
                </div>
              </div>
            </div>
          </div>

          {/* <div className="flex space-x-16 mt-16">
            <div className="w-[300px] shrink-0">
              <div className="bg-white p-4 rounded border border-gray-300 shadow">
                <Counter />
              </div>
            </div>
          </div> */}
        </div>
      </section>
    </div>
  );
}

function GridLines({
  rows,
  cols,
  color,
}: {
  rows: number;
  cols: number;
  color: "blue" | "gray";
}) {
  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  let colors = {
    blue: "bg-blue-100",
    gray: "bg-gray-100",
  };

  return (
    <div
      className={`z-0 absolute inset-0 grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px ${colors[color]} p-px`}
    >
      {grid.map((row, i) =>
        row.map((_, j) => <div key={`${i}_${j}`} className="bg-white"></div>),
      )}
    </div>
  );
}
