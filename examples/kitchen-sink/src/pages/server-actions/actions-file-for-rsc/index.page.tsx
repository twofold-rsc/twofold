import { action } from "./actions-file-for-rsc";
import { bucket } from "./shared";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Server actions file RSC
      </h1>
      <div className="mt-4 space-y-3">
        <div>Count: {bucket.count}</div>

        <form action={action}>
          <button
            type="submit"
            className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
          >
            Run action
          </button>
        </form>
      </div>
    </div>
  );
}
