import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Unauthorized</h1>

      <p className="mt-4">Invoke unauthorized from an API handler.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/unauthorized" />
      </div>
    </div>
  );
}
