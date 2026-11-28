export default function Page() {
  async function save() {
    "use server";
  }

  return (
    <form action={save}>
      <button type="submit">Save</button>
    </form>
  );
}
