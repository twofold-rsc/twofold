import { APIProps } from "@twofold/framework/types";

export function GET() {
  let data = {
    ok: true,
  };

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function POST({ request }: APIProps) {
  let form = await request.formData();
  let data = Object.fromEntries(form);

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}
