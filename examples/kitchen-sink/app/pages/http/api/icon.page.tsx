export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Icon</h1>

      <p className="mt-4">Return an icon from an API handler.</p>

      <div className="mt-4">
        <img src="/http/api/icon" className="size-8" />
      </div>
    </div>
  );
}
