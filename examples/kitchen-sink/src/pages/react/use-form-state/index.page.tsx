import FormWithState from "./form-with-state";

type Success = {
  type: "success";
};

type Error = {
  type: "error";
  errors: string[];
};

async function save(form: FormData): Promise<Success | Error> {
  "use server";

  await new Promise((resolve) => setTimeout(resolve, 1500));

  let name = form.get("name");
  if (!name || typeof name !== "string" || name !== "alice") {
    return {
      type: "error",
      errors: ["Name must be 'alice'"],
    };
  }

  return {
    type: "success",
  };
}

export default function FormStatePage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">useFormState</h1>
      <div className="mt-3">
        <FormWithState action={save} />
      </div>
    </div>
  );
}
