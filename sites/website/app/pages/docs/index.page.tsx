import { redirect } from "@twofold/framework/redirect";

export function before() {
  return redirect("/docs/guides/getting-started");
}

export default function DocsIndex() {
  return null;
}
