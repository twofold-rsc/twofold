export function RenderingEnvironments() {
  return (
    <div className="not-prose relative md:py-6 md:max-lg:left-1/2 md:max-lg:w-[92dvw] md:max-lg:-translate-x-1/2 lg:-mx-32">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
        <div className="flex origin-top-right flex-col rounded shadow-md md:-rotate-1">
          <div className="-mx-px flex items-center rounded-t border-x border-t border-emerald-950/30 bg-emerald-600 md:justify-center">
            <h4 className="px-4 py-2 font-sans text-lg font-bold tracking-tight text-emerald-50 md:text-center">
              RSC Render
            </h4>
          </div>
          <div className="grow rounded-b ring ring-emerald-950/10">
            <p className="px-4 py-3 font-serif md:px-6">
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
          <div className="flex items-center rounded-t border-x border-t border-blue-950/30 bg-blue-600 md:justify-center">
            <h4 className="px-4 py-2 font-sans text-lg font-bold tracking-tight text-blue-50 md:text-center">
              SSR Render
            </h4>
          </div>
          <div className="grow space-y-3 rounded-b px-4 py-4 font-serif ring ring-blue-950/10 md:px-6">
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

        <div className="flex origin-top-left flex-col rounded shadow-md md:rotate-1">
          <div className="-mx-px flex items-center rounded-t border-x border-t border-violet-950/30 bg-violet-600 md:justify-center">
            <h4 className="px-4 py-2 font-sans text-lg font-bold tracking-tight text-violet-50 md:text-center">
              Browser Render
            </h4>
          </div>
          <div className="grow space-y-3 rounded-b px-4 py-4 font-serif ring ring-violet-950/10 md:px-6">
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
