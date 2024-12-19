import { notFound } from "@twofold/framework/not-found";

export function before() {
  notFound();
}

export default function Page() {
  return <div>You should not see this!</div>;
}
