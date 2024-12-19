import Counter from "./counter";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Client component</h1>
      <p className="mt-3 max-w-prose">A component that runs on the client.</p>
      <div className="mt-3">
        <Counter />
      </div>
    </div>
  );
}
