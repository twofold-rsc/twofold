import { notFound } from "@twofold/framework/not-found";

export default function Page() {
  notFound();
  return <div>You should not see this!</div>;
}
