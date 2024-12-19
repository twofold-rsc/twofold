let serverValue = "N/A";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Bound form data</h1>
      <p className="mt-3 max-w-prose">
        In this example a server function is passed to a form component. The
        form invokes the function passing with the form's data as well as
        component props.
      </p>

      <p className="mt-3">
        The value on the server is{" "}
        <span className="bg-purple-50 px-1.5 py-0.5 font-medium text-purple-900">
          {serverValue}
        </span>
      </p>

      <div className="mt-6">
        <FormComponent name="bob" formId="1" />
      </div>

      <div className="mt-6">
        <FormComponent name="alice" formId="2" />
      </div>
    </div>
  );
}
function FormComponent({ name, formId }: { name: string; formId: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Form #{formId}</h2>
      <form
        action={async (formData: FormData) => {
          "use server";
          let name = formData.get("name");
          serverValue = `Name is ${name}, set by form #${formId}`;
        }}
        className="mt-1 flex items-center space-x-2"
      >
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
