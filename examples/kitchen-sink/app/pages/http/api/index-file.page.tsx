import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Index API</h1>

      <p className="mt-4">This page can fetch data from an index API route.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/nested" />
      </div>
    </div>
  );
}
