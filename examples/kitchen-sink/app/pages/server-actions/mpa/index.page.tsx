import { FormWithState } from "./form-with-state";

let state = { count: 0 };

async function action() {
  "use server";
  console.log("ran action");
}

async function increment() {
  "use server";

  state.count = state.count + 1;

  return state;
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
          <form action={action}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
            >
              Run action
            </button>
          </form>
        </div>

        <div className="border border-gray-200 p-4">
          <div>Form with state</div>
          <div className="pt-3">
            <FormWithState increment={increment} initialState={state} />
          </div>
        </div>
      </div>
    </div>
  );
}
