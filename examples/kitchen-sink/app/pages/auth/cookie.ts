"use server";

import cookies from "@twofold/framework/cookies";
import { redirect } from "@twofold/framework/redirect";

export async function setCookie() {
  "use server";
  cookies.set("allow-access", "true");
  redirect("/auth");
}

export async function clearCookie() {
  "use server";
  cookies.destroy("allow-access");
  redirect("/auth");
}
