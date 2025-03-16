async function action() {
  "use server";

  console.log("form...");
}

export default function MPAPage() {
  return (
    <div key="manual-binding">
      <h1 className="text-4xl font-black tracking-tighter">MPA + Form</h1>
      <p className="mt-3 max-w-prose">
        Here we test that you can still submit a form when JavaScript is
        disabled.
      </p>
      <div className="mt-4 space-y-3">
        <form action={action}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
