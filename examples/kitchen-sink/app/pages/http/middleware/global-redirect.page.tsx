export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Global middleware redirect
      </h1>

      <p className="mt-4">
        When this page is access directly using an SSR request the global
        middleware will redirect.
      </p>
    </div>
  );
}
