import { action } from "./actions-file-for-rsc";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Server actions file RSC
      </h1>
      <div className="mt-3 space-y-3">
        <form action={action}>
          <input
            type="submit"
            className="block min-w-[128px] rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
          />
        </form>
      </div>
    </div>
  );
}
