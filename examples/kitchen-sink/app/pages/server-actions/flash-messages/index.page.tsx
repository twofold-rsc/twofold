import { flash } from "@twofold/framework/flash";

function save() {
  "use server";

  // save something to the database...

  flash("Testing...");
}

export default function FlashMessagesPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Flash & Toast messages
      </h1>
      <p className="mt-3 max-w-prose">
        This page tests a server action that triggers a flash message.
      </p>
      <form action={save} className="mt-4">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/80"
        >
          Toast me
        </button>
      </form>
    </div>
  );
}
