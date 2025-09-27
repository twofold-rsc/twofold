export default function middleware(req: Request) {
  let url = new URL(req.url);

  // match SSR requests as well as RSC client-side navigation requests
  // for global middleware page
  if (
    url.pathname.match(/\/middleware\/global$/) ||
    url.searchParams.get("path")?.match(/\/middleware\/global$/)
  ) {
    console.log("running global middleware function!");
  }

  // match SSR requests only for the global middleware
  // redirect page
  if (url.pathname.match(/\/middleware\/global-redirect$/)) {
    console.log("running global iddleware redirect!");
    return new Response(null, {
      status: 302,
      headers: {
        location: "/http/middleware/global-redirect-end",
      },
    });
  }
}
