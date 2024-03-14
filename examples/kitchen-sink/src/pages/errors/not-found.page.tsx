export default function NotFoundPage({ request }: { request: Request }) {
  let url = new URL(request.url);

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Not Found</h1>
      <p className="mt-3">
        Sorry, the path{" "}
        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
          {url.pathname}
        </span>{" "}
        could not be found.
      </p>
    </div>
  );
}
