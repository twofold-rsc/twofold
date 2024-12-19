import { APIForm } from "./api-form";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Post request</h1>

      <p className="mt-4">Post request to API handler.</p>

      <div className="mt-4">
        <APIForm />
      </div>
    </div>
  );
}
