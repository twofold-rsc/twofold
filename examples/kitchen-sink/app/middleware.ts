export default function middleware(req: Request) {
  let url = new URL(req.url);

  // match SSR requests as well as RSC client-side navigation requests
  if (
    url.pathname.includes("/middleware/global") ||
    url.searchParams.get("path")?.match(/middleware\/global/)
  ) {
    console.log("running global middleware function!");
  }
}
