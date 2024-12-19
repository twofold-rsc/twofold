import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Middleware</h1>

      <p className="mt-4">Run middleware in API handlers.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/middleware" />
      </div>
    </div>
  );
}
