let count = 0;

async function handle() {
  "use server";
  count = count + 1;
}

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Server action</h1>
      <p className="mt-3">
        The count is{" "}
        <span className="bg-purple-50 px-1.5 py-0.5 font-medium text-purple-900">
          {count}
        </span>
      </p>
      <form action={handle} className="mt-3">
        <button
          type="submit"
          className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          count + 1
        </button>
      </form>
    </div>
  );
}
