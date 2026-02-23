export function RenderingEnvironments() {
  return (
    <div className="not-prose -mx-32 py-6">
      <div className="grid grid-cols-3 gap-8">
        <div className="flex origin-top-right -rotate-1 flex-col rounded shadow-md">
          <div className="-mx-px flex items-center justify-center rounded-t border-x border-t border-emerald-950/30 bg-emerald-600">
            <h4 className="px-4 py-2 text-center font-sans text-lg font-bold tracking-tight text-emerald-50">
              RSC Render
            </h4>
          </div>
          <div className="grow rounded-b ring ring-emerald-950/10">
            <p className="px-6 py-3 font-serif">
              The RSC render is responsible for executing React Server
              Components. When an error is thrown inside a Server Component the
              error object gets serialized into the RSC stream in place of the
              component tree. The error does not causing rendering to crash, but
              instead it gets turned into data that exists within the RSC
              stream.
            </p>
          </div>
        </div>

        <div className="flex flex-col rounded shadow-md">
          <div className="flex items-center justify-center rounded-t border-x border-t border-blue-950/30 bg-blue-600">
            <h4 className="px-4 py-2 text-center font-sans text-lg font-bold tracking-tight text-blue-50">
              SSR Render
            </h4>
          </div>
          <div className="grow space-y-3 rounded-b px-6 py-4 font-serif ring ring-blue-950/10">
            <p>
              The SSR render is responsible for turning an RSC stream and its
              client components into HTML. When an error is thrown during SSR
              one of two things happens:
            </p>
            <p>
              If the error happens inside a{" "}
              <span className="font-mono text-sm font-semibold">
                `&lt;Suspense&gt;`
              </span>{" "}
              boundary, then everything inside that boundary stops rendering.
            </p>
            <p>Otherwise SSR throws and exits.</p>
          </div>
        </div>

        <div className="flex origin-top-left rotate-1 flex-col rounded shadow-md">
          <div className="-mx-px flex items-center justify-center rounded-t border-x border-t border-violet-950/30 bg-violet-600">
            <h4 className="px-4 py-2 text-center font-sans text-lg font-bold tracking-tight text-violet-50">
              Browser Render
            </h4>
          </div>
          <div className="grow space-y-3 rounded-b px-6 py-4 font-serif ring ring-violet-950/10">
            <p>
              This is client-side React render that is most familiar for
              front-end developers. If an error is thrown here then React will
              allow the closest Error Boundary to catch the error and display a
              friendly fallback. This is the only environment where React
              supports Error Boundaries, and is the best place for errors to be
              caught and displayed to the user.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
