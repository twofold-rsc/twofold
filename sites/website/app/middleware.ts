export default function (request: Request) {
  let url = new URL(request.url);
  if (url.hostname === "www.twofoldframework.com") {
    return new Response("", {
      status: 301,
      headers: {
        Location: `https://twofoldframework.com${url.pathname}${url.search}`,
        "Cache-Control": "public, max-age=604800",
      },
    });
  }
}
