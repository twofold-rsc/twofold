import CCInvokesAction from "./action-file-for-cc-client-component";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Server actions file CC
      </h1>
      <div className="mt-3 space-y-3">
        <CCInvokesAction />
      </div>
    </div>
  );
}
