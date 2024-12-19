let log = "";

let database = {
  record: {
    name: "ryan",
    updatedAt: new Date(),
    createdAt: new Date(),
  },
};

export default function Page() {
  // pretend this was fetched from a database

  let record = { ...database.record };

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Bound object</h1>
      <p className="mt-3 max-w-prose">
        In this example a server function is automatically bound to a high
        fidelity object.
      </p>

      {log && (
        <p className="mt-3">
          <span className="text-gray-900">{log}</span>
        </p>
      )}

      <div className="mt-3">
        <form
          action={async (formData: FormData) => {
            "use server";
            let name = formData.get("name");

            database.record.name = name as string;
            database.record.updatedAt = new Date();

            log = `Name changed from ${record.name} to ${name}. It was created ${record.createdAt}.`;
          }}
          className="mt-1 flex items-center"
        >
          <input
            name="name"
            defaultValue={record.name}
            className="rounded border border-gray-300 px-1.5 py-1 shadow-sm"
          />
          <button
            type="submit"
            className="ml-2 rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
          >
            Update name
          </button>
        </form>
      </div>
    </div>
  );
}
