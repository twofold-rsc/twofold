import { EnterDocsLink } from "./contexts/enter-docs";

export default async function Page() {
  let rows = 25;
  let cols = 25;

  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  return (
    <>
      <title>Twofold</title>
      <meta property="og:title" content="Twofold" />
      <meta
        property="og:description"
        content="A React Server Component framework"
      />

      <div className="relative grow flex flex-col items-center justify-center">
        <div
          data-enter-docs-section="grid"
          className="z-0 absolute inset-0 w-full h-full grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px bg-[rgb(243,244,246)] p-px"
          style={{
            transform: "scale(1)",
          }}
        >
          {grid.map((row, i) =>
            row.map((_, j) => (
              <div key={`${i}_${j}`} className="bg-white"></div>
            )),
          )}
        </div>
        <div
          data-enter-docs-section="hero"
          className="z-10 max-w-7xl px-8 w-full mx-auto"
        >
          <div className="max-w-[800px]">
            <h1 className="text-7xl font-black tracking-tighter">Twofold</h1>
            <p className="mt-1 leading-tight text-gray-600 font-medium tracking-tight text-3xl">
              A framework for building demos and weekend projects with React
              Server Components, Tailwind, and TypeScript.
            </p>
            <div className="mt-6">
              <EnterDocsLink
                href="/docs/guides/getting-started"
                className="inline-flex space-x-2 items-center text-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow font-semibold"
              >
                <span>Get started</span>
              </EnterDocsLink>
            </div>
          </div>
        </div>
      </div>
    </>
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
