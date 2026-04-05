"use server";

import { behaveBasedOnFormData } from "@/app/auth";
import { AuthPolicyArray } from "@twofold/framework/auth";

export const auth: AuthPolicyArray = [behaveBasedOnFormData];

export default async function action(formData: FormData) {
  return (
    <div>
      This is a server component returned by a server action. It will only be
      returned if the authentication policies pass. The behaviour was '
      {formData.get("behaviour")?.toString()}'.
    </div>
  );
}
