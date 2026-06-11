import { AuthPolicyArray, reset } from "@twofold/framework/auth";
import { getValueFromAuthCache } from "@twofold/framework/auth-server";

export const auth: AuthPolicyArray = [reset];

export function GET() {
  const profile = getValueFromAuthCache<{ value: string }>("profile");

  return new Response(
    JSON.stringify({
      message: `This is an API route that uses 'reset' to skip the authentication policies of the parent routes. Profile value: ${profile?.value}`,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    },
  );
}
