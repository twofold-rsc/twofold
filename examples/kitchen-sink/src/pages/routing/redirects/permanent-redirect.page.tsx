import { redirect } from "@twofold/framework/redirect";

export default function Page() {
  redirect("/routing/redirects/ending", { permanent: true });
  return <div>You should not see this!</div>;
}
