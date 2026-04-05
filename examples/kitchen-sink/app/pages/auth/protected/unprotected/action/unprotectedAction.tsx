"use server";

import { AuthPolicyArray, reset } from "@twofold/framework/auth";

export const auth: AuthPolicyArray = [reset];

export default async function action(formData: FormData) {
  return (
    <div>
      This is a server component returned by a server action. It is running on
      an action that uses 'reset' to allow access regardless of the parent
      routes. The behaviour was '{formData.get("behaviour")?.toString()}'.
    </div>
  );
}
