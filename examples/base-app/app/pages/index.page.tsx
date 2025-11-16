export default async function Page() {
  return (
    <>
      <title>Welcome to Twofold</title>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter">
          Welcome to Twofold
        </h1>
        <p className="mt-4 max-w-prose text-lg">
          Get started with React Server Components by editing{" "}
          <span className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm">
            app/pages/index.page.tsx
          </span>
          .
        </p>
      </div>
    </>
  );
}
