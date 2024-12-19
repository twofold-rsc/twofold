import cookies from "@twofold/framework/cookies";
import { APIProps } from "@twofold/framework/types";

export function GET() {
  let data = {
    value: cookies.get("api-cookie") ?? "",
  };

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function POST({ request }: APIProps) {
  let formData = await request.formData();
  let value = formData.get("value");

  if (typeof value === "string") {
    cookies.set("api-cookie", value);
  }

  return new Response(null, {
    status: 201,
  });
}

export function DELETE() {
  cookies.destroy("api-cookie");

  return new Response(null, {
    status: 204,
  });
}
