export function before() {
  console.log("API middleware ran");
}

export function GET() {
  let data = {
    middleware: true,
  };

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}
