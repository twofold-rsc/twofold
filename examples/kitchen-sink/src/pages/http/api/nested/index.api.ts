export function GET() {
  let data = { ok: true, index: true };

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}
