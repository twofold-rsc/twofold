import { AuthPolicyArray, reset } from "@twofold/framework/auth";

export const auth: AuthPolicyArray = [reset];

export function GET() {
  return new Response(
    JSON.stringify({
      message:
        "This is an API route that uses 'reset' to skip the authentication policies of the parent routes.",
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    },
  );
}
