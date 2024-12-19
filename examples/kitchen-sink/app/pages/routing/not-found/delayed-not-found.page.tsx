import { notFound } from "@twofold/framework/not-found";

export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  notFound();
  return <div>You should not see this!</div>;
}
