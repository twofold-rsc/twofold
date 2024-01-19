async function save() {
  "use server";
  throw new Error("Oh no!");
}

export default function ActionMissingUseServer() {
  return (
    <form action={save} className="space-y-2">
      <div>
        <button type="submit" className="bg-black text-white px-2.5 py-1">
          Fire action
        </button>
      </div>
    </form>
  );
}
