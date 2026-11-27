import { save } from "../actions/save";

export default function Page() {
  async function reset() {
    "use server";
    console.log("This is not a 'use client' directive");
  }

  return (
    <form action={reset}>
      <button formAction={save}>Save</button>
      <button>Reset</button>
    </form>
  );
}
