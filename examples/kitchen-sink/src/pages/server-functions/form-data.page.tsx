let name = "ryan";

async function handleFormArg(form: FormData) {
  "use server";

  let formName = form.get("name");
  if (typeof formName === "string") {
    name = formName;
  }
}

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Form data</h1>
      <p className="mt-3 max-w-prose">
        In this example a server function is passed to a form element. The form
        invokes the function passing with the form's data.
      </p>

      <p className="mt-3">
        The name on the server is{" "}
        <span className="bg-purple-50 px-1.5 py-0.5 font-medium text-purple-900">
          {name}
        </span>
      </p>

      <form action={handleFormArg} className="mt-3 flex items-center space-x-2">
        <input
          name="name"
          defaultValue={name}
          className="rounded border border-gray-300 px-1.5 py-1 shadow-sm"
        />
        <button
          type="submit"
          className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Update name
        </button>
      </form>
    </div>
  );
}
