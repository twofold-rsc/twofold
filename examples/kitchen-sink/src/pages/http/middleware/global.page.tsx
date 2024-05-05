export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Global middleware
      </h1>

      <p className="mt-4">
        This page uses global middleware to log to the console before rendering.
      </p>
    </div>
  );
}
