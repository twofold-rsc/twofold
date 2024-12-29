import { notFound } from "@twofold/framework/not-found";

let shouldNotFoundInRender = false;

async function action() {
  "use server";
  shouldNotFoundInRender = true;
}

export default function Page() {
  if (shouldNotFoundInRender) {
    // eslint-disable-next-line react-compiler/react-compiler
    shouldNotFoundInRender = false;
    notFound();
  }

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Not found in render after action
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          An action is invoked and the page triggers a not found while
          revalidating.
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
