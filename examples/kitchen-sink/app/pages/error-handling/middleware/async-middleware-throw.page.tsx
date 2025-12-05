export async function before() {
  await new Promise((r) => setTimeout(r, 1000));
  throw new Error("Crash!");
}

export default function Page() {
  return <div>You shouldn't see this</div>;
}
