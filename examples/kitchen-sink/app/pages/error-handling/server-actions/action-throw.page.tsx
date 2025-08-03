async function save() {
  "use server";
  throw new Error("Oh no!");
}

export default function ActionMissingUseServer() {
  return (
    <form action={save} className="space-y-2">
      <div>
        <button
          type="submit"
          className="rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          Fire action
        </button>
      </div>
    </form>
  );
}
