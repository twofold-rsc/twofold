async function save() {
  "use server";
  throw new Error("Oh no!");
}

export default function ActionMissingUseServer() {
  return (
    <form action={save} className="space-y-2">
      <div>
        <button type="submit" className="bg-black px-2.5 py-1 text-white">
          Fire action
        </button>
      </div>
    </form>
  );
}
