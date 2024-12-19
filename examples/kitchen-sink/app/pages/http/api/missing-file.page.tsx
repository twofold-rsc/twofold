import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Missing API</h1>

      <p className="mt-4">API request to a handler that does not exist.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/missing-handler" />
      </div>
    </div>
  );
}
