import Counter from "./counter";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Unformatted</h1>
      <p className="mt-3 max-w-prose">
        A file that contains client components without formatting.
      </p>
      <div className="mt-3 space-y-6">
        <Counter />
      </div>
    </div>
  );
}
