import { unauthorized } from "@twofold/framework/unauthorized";

async function action() {
  "use server";

  //  TODO: this errors and renders the correct component, but is not
  //  being caught correctly on the server (probs needs a safe error)

  await new Promise((resolve) => setTimeout(resolve, 100));
  unauthorized();
}

export default function Page() {
  return (
    <form action={action}>
      <button className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white">
        Run action
      </button>
    </form>
  );
}
