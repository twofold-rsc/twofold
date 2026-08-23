import { APIProps } from "@twofold/framework/types";

export function GET({ params }: APIProps<"an-id">) {
  let data = { ok: true, "an-id": params["an-id"] };

  return Response.json(data);
}
