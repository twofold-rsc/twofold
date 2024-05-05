import { redirect } from "@twofold/framework/redirect";

export function before() {
  redirect("/docs/philosophy/dont-use-twofold");
}

export default function Page() {
  return null;
}
