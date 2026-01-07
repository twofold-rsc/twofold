import { unauthorized } from "@twofold/framework/unauthorized";

export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  unauthorized();

  // return <div>You shouldn't see this</div>;
}
