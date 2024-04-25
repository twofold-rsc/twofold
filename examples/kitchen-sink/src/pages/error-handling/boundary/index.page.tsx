import Link from "@twofold/framework/link";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Error boundaries
      </h1>
      <p className="mt-3 max-w-prose text-gray-700">
        Clicking the link below will render a page that throws an error. That
        error will be caught by the error boundary that sits above in the shared
        layout.
      </p>
      <div className="mt-4">
        <Link
          href="/error-handling/boundary/throws"
          className="text-blue-500 underline"
        >
          Visit a page that errors
        </Link>
      </div>
    </div>
  );
}
