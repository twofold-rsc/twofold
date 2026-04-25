import MyForm from "./server-action-redirect-form";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Server action redirect
      </h1>
      <div className="mt-3">
        <MyForm />
      </div>
    </div>
  );
}
