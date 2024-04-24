import { sql } from "./database";

async function vote(form: FormData) {
  "use server";

  await sql`update flavors set votes = votes + 1 where id = ${form.get("flavor")};`;
}

async function reset() {
  "use server";

  await sql`update flavors set votes = 0;`;
}

export async function ServerActionPoll() {
  let flavors = await sql`select * from flavors;`;

  return (
    <div>
      <h2 className="text-xl text-gray-900 text-center">🍨 Ice cream poll</h2>
      <p className="text-center text-sm mt-3 text-gray-700">
        What's your favorite ice cream flavor?
      </p>
      <form action={vote} className="mt-6">
        <div className="divide-y">
          {flavors.map((flavor) => (
            <div className="flex items-center py-3" key={flavor.id}>
              <span className="w-1/5 text-gray-400 text-lg tabular-nums text-center">
                {flavor.votes}
              </span>
              <span className="w-3/5">
                {flavor.name}

                {flavors.toSorted((a, b) => b.votes - a.votes)[0] === flavor &&
                flavor.votes > 0
                  ? " 🏆"
                  : ""}
              </span>
              <button
                type="submit"
                value={flavor.id}
                name="flavor"
                className="text-white text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded w-1/5 focus:outline-none focus-visible:ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500 active:bg-blue-700"
              >
                Vote
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-2">
          <button
            formAction={reset}
            className="underline text-gray-400 text-xs"
          >
            Reset results
          </button>
        </div>
      </form>
    </div>
  );
}
