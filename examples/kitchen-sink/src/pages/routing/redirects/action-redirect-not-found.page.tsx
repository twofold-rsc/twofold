import { redirect } from "@twofold/framework/redirect";

async function action() {
  "use server";
  redirect("/routing/redirects/this-page-doesnt-exist");
  console.log("You should not see this!");
}

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Action redirect not found
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          This action triggers a redirect to a page that doesn't exist.
        </p>

        <div className="mt-6">
          <form action={action}>
            <button
              type="submit"
              className="rounded bg-black px-4 py-1.5 font-medium text-white disabled:opacity-50"
            >
              Run action
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
