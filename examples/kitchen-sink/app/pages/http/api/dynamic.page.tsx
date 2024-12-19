import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Dynamic API</h1>

      <p className="mt-4">Dynamic path API handlers.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/nested/123" />
      </div>
    </div>
  );
}
