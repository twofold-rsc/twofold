import { PageProps } from "@twofold/framework/types";
import { logFromActionFile } from "./actions";
import { FormWithClientState, State } from "./form-with-client-state";
import { FormWithServerState } from "./form-with-server-state";
import Link from "@twofold/framework/link";
import { redirect } from "@twofold/framework/redirect";

let state = { count: 0 };

async function log() {
  "use server";
  console.log("running an action that logs to the console");
}

async function increment() {
  "use server";

  state.count = state.count + 1;

  return state;
}

async function clientFormAction(prev: State, formData: FormData) {
  "use server";

  let data = Object.fromEntries(formData.entries());
  let isValid = data.name === "alice";

  return {
    name: typeof data.name === "string" ? data.name : "",
    success: isValid,
    error: !isValid ? "Name must be alice" : null,
  };
}

async function redirectAction() {
  "use server";
  redirect("/server-actions/mpa?redirected=true");
}

async function errorAction() {
  "use server";
  throw new Error("This action threw an error");
}

export default function MPAPage({ searchParams }: PageProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">MPA + Form</h1>
      <p className="mt-3 max-w-prose">
        Here we test that you can still submit a form when JavaScript is
        disabled.
      </p>
      <div className="mt-4 space-y-3">
        <div className="border border-gray-200 p-4">
          <div>Form with action</div>
          <form action={log} className="pt-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
            >
              Run action
            </button>
          </form>
        </div>

        <div className="border border-gray-200 p-4">
          <div>Form with server state</div>
          <div className="pt-3">
            <FormWithServerState increment={increment} initialState={state} />
          </div>
        </div>

        <div className="border border-gray-200 p-4">
          <div>Form with client state</div>
          <div className="pt-3">
            <FormWithClientState action={clientFormAction} />
          </div>
        </div>

        <div className="border border-gray-200 p-4">
          <div>Imported action</div>
          <form action={logFromActionFile} className="pt-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
            >
              Run action
            </button>
          </form>
        </div>

        <div className="border border-gray-200 p-4">
          <div>Action that redirects</div>
          <form action={redirectAction} className="pt-3">
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
              >
                Run action
              </button>

              {searchParams.get("redirected") && (
                <>
                  <div className="text-green-500">Redirected</div>

                  <Link
                    href="/server-actions/mpa"
                    className="text-sm text-gray-500 underline"
                  >
                    Clear
                  </Link>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="border border-gray-200 p-4">
          <div>Action that errors</div>
          <form action={errorAction} className="pt-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
            >
              Run action
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
