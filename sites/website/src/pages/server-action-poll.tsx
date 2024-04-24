import { sql } from "./database";

async function vote(form: FormData) {
  "use server";

  await sql`update flavors set votes = votes + 1 where id = ${form.get("flavor")}`;
}

export async function ServerActionPoll() {
  let flavors = await sql`select * from flavors`;

  return (
    <div>
      <h2 className="text-xl text-gray-900 text-center">🍨 Ice cream poll</h2>
      <p className="text-center text-sm mt-3 text-gray-700">
        What's your favorite ice cream flavor?
      </p>
      <form action={vote} className="divide-y mt-6">
        {flavors.map((flavor) => (
          <div className="flex items-center py-3" key={flavor.id}>
            <span className="w-1/5 text-gray-400 text-lg tabular-nums text-center">
              {flavor.votes}
            </span>
            <span className="w-3/5">
              {flavor.name}

              {flavors.toSorted((a, b) => b.votes - a.votes)[0] === flavor
                ? " 🏆"
                : ""}
            </span>
            <button
              type="submit"
              value={flavor.id}
              name="flavor"
              className="text-white text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded w-1/5"
            >
              Vote
            </button>
          </div>
        ))}
      </form>
    </div>
  );
}
