import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Dashed dynamic API
      </h1>

      <p className="mt-4">Dynamic API parameters with dashed names.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/nested/dashed/123" />
      </div>
    </div>
  );
}
