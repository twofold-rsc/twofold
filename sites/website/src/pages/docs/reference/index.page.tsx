import { redirect } from "@twofold/framework/redirect";

export function before() {
  redirect("/docs/reference/cookies");
}

export default function Page() {
  return null;
}
