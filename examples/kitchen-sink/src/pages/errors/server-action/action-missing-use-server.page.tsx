async function save(formData: FormData) {
  console.log("saving form...");
  console.log(Object.fromEntries(formData.entries()));
}

export default function ActionMissingUseServer() {
  return (
    <form action={save} className="space-y-2">
      <div>
        <label htmlFor="name" className="block text-sm text-gray-500">
          Name
        </label>
        <input
          type="text"
          name="name"
          className="border border-gray-300 px-2 py-1"
          placeholder="Name"
        />
      </div>
      <div>
        <button type="submit" className="bg-black text-white px-2.5 py-1">
          Save
        </button>
      </div>
    </form>
  );
}
