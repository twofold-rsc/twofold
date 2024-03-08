export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Server action binding
      </h1>
      <div className="mt-3 space-y-3">
        <ActionComponent id="one" />
        <ActionComponent id="two" />
        <ActionComponent id="three" />
      </div>
    </div>
  );
}

async function run(id: string) {
  "use server";
  console.log("Action run with:", id);
}

function ActionComponent({ id }: { id: string }) {
  let runAction = run.bind(null, id);

  return (
    <form action={runAction}>
      <button
        type="submit"
        className="block min-w-[128px] rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
      >
        Run {id}
      </button>
    </form>
  );
}
