import { behaveBasedOnQueryString } from "@/app/auth";
import { AuthPolicyArray } from "@twofold/framework/auth";
import { getValueFromAuthCache } from "@twofold/framework/auth-server";

export const auth: AuthPolicyArray = [behaveBasedOnQueryString];

export function GET() {
  const profile = getValueFromAuthCache<{ value: string }>("profile");

  return new Response(
    JSON.stringify({
      message: `This is an API route that only runs if the authentication policies pass. Profile value: ${profile?.value}`,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    },
  );
}
