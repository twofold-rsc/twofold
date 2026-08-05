let middleware = false;

export function before() {
  middleware = true;
}

export function GET() {
  let data = {
    middleware,
  };

  middleware = false;

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}
