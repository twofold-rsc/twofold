let counterMap = new Map<string, number>();

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Server action automatic binding
      </h1>
      <p className="mt-3 max-w-prose">
        In this example a server function closes over a component prop.
      </p>
      <div className="mt-4 space-y-3">
        <ActionComponent id="one" />
        <ActionComponent id="two" />
        <ActionComponent id="three" />
      </div>
    </div>
  );
}

function ActionComponent({ id }: { id: string }) {
  async function run() {
    "use server";
    counterMap.set(id, (counterMap.get(id) ?? 0) + 1);
  }

  return (
    <div className="flex items-center space-x-2">
      <form action={run}>
        <button
          type="submit"
          className="block min-w-[128px] rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Run {id}
        </button>
      </form>
      <div>
        Count: <span className="tabular-nums">{counterMap.get(id) ?? 0}</span>
      </div>
    </div>
  );
}
