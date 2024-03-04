import Counter from "./multiple-components";
import { Uppercase } from "./multiple-components";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Named exports</h1>
      <p className="mt-3 max-w-prose">
        A file that exports multiple client components.
      </p>
      <div className="mt-3 space-y-6">
        <Counter />
        <Uppercase />
      </div>
    </div>
  );
}
