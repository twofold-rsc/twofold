import { unauthorized } from "@twofold/framework/unauthorized";

async function action() {
  "use server";

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
