import { FormWithClientState, State } from "./form-with-client-state";
import { FormWithServerState } from "./form-with-server-state";

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

export default function MPAPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">MPA + Form</h1>
      <p className="mt-3 max-w-prose">
        Here we test that you can still submit a form when JavaScript is
        disabled.
      </p>
      <div className="mt-4 space-y-3">
        <div className="border border-gray-200 p-4">
          <form action={log}>
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
      </div>
    </div>
  );
}
