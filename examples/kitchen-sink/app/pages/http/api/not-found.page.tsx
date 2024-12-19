import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Not found</h1>

      <p className="mt-4">Invoke notFound from an API handler.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/not-found" />
      </div>
    </div>
  );
}
