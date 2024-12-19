import { createIncrementAction, database } from "./action";

export default function Page() {
  let by1Action = createIncrementAction(1);
  let by3Action = createIncrementAction(3);

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Action factory</h1>
      <div className="mt-3 space-y-3">
        <div>Count: {database.count}</div>
        <form action={by1Action} className="mt-4">
          <button
            type="submit"
            className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow disabled:bg-black/60"
          >
            Run increment by 1
          </button>
        </form>
        <form action={by3Action} className="mt-4">
          <button
            type="submit"
            className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow disabled:bg-black/60"
          >
            Run increment by 3
          </button>
        </form>
      </div>
    </div>
  );
}
