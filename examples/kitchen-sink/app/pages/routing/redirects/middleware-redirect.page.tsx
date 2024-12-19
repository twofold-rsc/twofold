import { redirect } from "@twofold/framework/redirect";

export function before() {
  redirect("/routing/redirects/ending");
}

export default function Page() {
  return <div>You should not see this!</div>;
}
