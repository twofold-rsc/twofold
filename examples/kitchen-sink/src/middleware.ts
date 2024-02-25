export default function middleware(req: Request) {
  let url = new URL(req.url);

  // match SSR requests as well as RSC client-side navigation requests
  if (
    url.searchParams.has("global-middleware") ||
    url.searchParams.get("path")?.match(/global-middleware/)
  ) {
    console.log("running global middleware function!");
  }
}
