export function RenderingEnvironments() {
  return (
    <div className="not-prose">
      <div className="-mx-24 grid grid-cols-3 gap-8">
        <div className="-rotate-1 rounded shadow-md">
          <div className="-mx-px flex items-center justify-center rounded-t border-x border-t border-emerald-950/30 bg-emerald-600">
            <h4 className="px-4 py-2 text-center font-sans text-lg font-bold tracking-tight text-emerald-50">
              RSC Render
            </h4>
          </div>
          <div className="rounded-b ring ring-emerald-950/10">
            <p className="px-6 py-3 font-serif">
              This is the process responsible for rendering and executing React
              Server Components. When an error is thrown during the RSC render
              then the component tree is replaced by that error. The error does
              not causing rendering to crash, but instead it gets turned into
              data and is serialized right into the RSC stream.
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center">
            <h4>The SSR Render</h4>
          </div>
          <p></p>
        </div>
        <div>
          <h4>The Browser Render</h4>
          <p></p>
        </div>
      </div>
    </div>
  );
}
