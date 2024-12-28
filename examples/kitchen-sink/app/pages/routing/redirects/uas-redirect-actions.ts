"use server";

import { redirect } from "@twofold/framework/redirect";

export async function serverFunction(shouldRedirect: boolean) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (shouldRedirect) {
    redirect("/routing/redirects/ending");
  }

  let randomString = Math.random().toString(36).substring(2, 15);
  return { randomString };
}
