export function before() {
  throw new Error("Crash!");
}

export default function Page() {
  return <div>You shouldn't see this</div>;
}
