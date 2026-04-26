"use server";

import { redirect } from "@twofold/framework/redirect";

export async function action(
  shouldRedirect: boolean,
): Promise<{ value: string }> {
  "use server";
  if (shouldRedirect) {
    redirect("/routing/redirects/uas-typed-redirect");
  } else {
    return {
      value: "another-value",
    };
  }
}
