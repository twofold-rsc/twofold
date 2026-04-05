import { behaveBasedOnQueryString } from "@/app/auth";
import { AuthPolicyArray } from "@twofold/framework/auth";

export const auth: AuthPolicyArray = [behaveBasedOnQueryString];

export default function Page() {
  return (
    <div>
      This message won't show unless the authentication policies allow it.
    </div>
  );
}
