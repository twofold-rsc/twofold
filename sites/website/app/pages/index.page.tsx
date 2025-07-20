import { PageProps } from "@twofold/framework/types";
import { EnterDocsLink } from "./enter-docs";

export default async function Page({ request }: PageProps) {
  let rows = 25;
  let cols = 25;

  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  let url = new URL(request.url);
  let ogImageUrl = new URL("/og-image.png", url.origin);

  return (
    <>
      <title>Twofold</title>
      <meta
        property="description"
        content="A React Server Component framework"
      />

      <meta property="og:title" content="Twofold" />
      <meta
        property="og:description"
        content="A React Server Component framework"
      />
      <meta property="og:site_name" content="Twofold" />
      <meta property="og:image" content={ogImageUrl.href} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Twofold" />
      <meta name="twitter:image" content={ogImageUrl.href} />

      <div className="relative flex grow flex-col items-center justify-center">
        <div
          data-enter-docs-section="grid"
          className="absolute inset-0 z-0 grid h-full w-full grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px bg-[rgb(243,244,246)] p-px"
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
          className="z-10 mx-auto w-full max-w-7xl px-8"
        >
          <div className="max-w-[800px]">
            <h1 className="text-7xl font-black tracking-tighter">Twofold</h1>
            <p className="mt-1 text-3xl leading-tight font-medium tracking-tight text-gray-600">
              A framework for building weekend projects with React Server
              Components, Tailwind, and TypeScript.
            </p>
            <div className="mt-6">
              <EnterDocsLink
                href="/docs/guides/getting-started"
                className="inline-flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-3 text-xl font-semibold text-white shadow hover:bg-blue-700"
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
      className={`absolute inset-0 z-0 grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px ${colors[color]} p-px`}
    >
      {grid.map((row, i) =>
        row.map((_, j) => <div key={`${i}_${j}`} className="bg-white"></div>),
      )}
    </div>
  );
}
