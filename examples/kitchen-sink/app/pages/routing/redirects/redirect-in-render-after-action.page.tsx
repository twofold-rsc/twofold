import { redirect } from "@twofold/framework/redirect";

let shouldRedirectInRender = false;

async function action() {
  "use server";
  shouldRedirectInRender = true;
}

export default function Page() {
  if (shouldRedirectInRender) {
    // @eslint-disable-next-line react-hooks/rules-of-hooks
    shouldRedirectInRender = false;
    redirect("/routing/redirects/ending");
  }

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Redirect in render after action
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          An action is invoked and the page redirects while revalidating.
        </p>

        <div className="mt-6">
          <form action={action}>
            <button
              type="submit"
              className="rounded bg-black px-4 py-1.5 font-medium text-white disabled:opacity-50"
            >
              Run action
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
