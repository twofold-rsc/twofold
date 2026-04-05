import { behaveBasedOnQueryString } from "@/app/auth";
import { AuthPolicyArray } from "@twofold/framework/auth";

export const auth: AuthPolicyArray = [behaveBasedOnQueryString];

export function GET() {
  return new Response(
    JSON.stringify({
      message:
        "This is an API route that only runs if the authentication policies pass.",
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    },
  );
}
