import Database from "better-sqlite3";
import { z } from "zod";

const db = new Database("db/demo.db");
db.pragma("journal_mode = WAL");

let userSchema = {
  id: z.number(),
  name: z.string(),
  email: z.string(),
};

db.table("users", {
  columns: Object.keys(userSchema),
  rows: function* () {
    yield { id: 1, name: "John", email: "john@example.com" };
    yield { id: 2, name: "Bob", email: "bob@example.com" };
    yield { id: 3, name: "Alice", email: "alice@example.com" };
  },
});

let allUsers = z.array(z.object(userSchema));

export default async function Page() {
  let result = db.prepare("SELECT * FROM users").all();
  let users = allUsers.parse(result);
  //  ^?

  return (
    <div>
      <ul className="list-disc pl-4">
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
