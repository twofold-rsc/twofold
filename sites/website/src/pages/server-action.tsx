import { sql } from "./database";

async function update() {
  "use server";

  console.log("hello running action!");

  sql`update analytics set count = count + 1;`;
}

export default async function ServerAction() {
  let rows = sql`select * from analytics;`;

  return (
    <div>
      <div>
        <h3 className="text-gray-500 text-center text-sm">
          Analytics database
        </h3>
        <table className="w-full mt-4">
          <thead className="[&_th]:text-left [&_th]:pb-2 [&_th]:border-b [&_th]:border-gray-100">
            <tr>
              <th className="w-2/5">ID</th>
              <th className="w-3/5">Count</th>
            </tr>
          </thead>
          <tbody className="[&_td]:border-b [&_td]:border-gray-100 [&_td]:py-2 [&_td]:last-of-type:[&_tr]:border-none [&_td]:last-of-type:[&_tr]:pb-0">
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={update} className="mt-4">
        <button
          type="submit"
          className="rounded shadow px-3 py-1.5 font-medium text-white bg-gray-950 w-full"
        >
          Update row #2
        </button>
      </form>
    </div>
  );
}
