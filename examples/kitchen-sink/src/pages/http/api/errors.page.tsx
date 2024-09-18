import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Errors</h1>

      <p className="mt-4">An API handler that throws an error.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/errors" />
      </div>
    </div>
  );
}
