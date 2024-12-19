import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Missing API export
      </h1>

      <p className="mt-4">
        API request to a file that does not export a handler.
      </p>

      <div className="mt-4">
        <APIFetcher path="/http/api/empty" />
      </div>
    </div>
  );
}
