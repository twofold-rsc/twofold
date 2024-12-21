import { redirect } from "@twofold/framework/redirect";

export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  redirect("/routing/redirects/ending");
  return <div>You should not see this!</div>;
}
