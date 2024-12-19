import { redirect } from "@twofold/framework/redirect";

export function before() {
  redirect("/docs/guides/getting-started");
}

export default function Page() {
  return null;
}
