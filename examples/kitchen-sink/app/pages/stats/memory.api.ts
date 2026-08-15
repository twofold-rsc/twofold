export function GET() {
  return Response.json(process.memoryUsage(), {
    headers: {
      "cache-control": "no-store",
    },
  });
}
