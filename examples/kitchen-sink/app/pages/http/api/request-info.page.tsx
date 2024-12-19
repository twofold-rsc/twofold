import { APIFetcher } from "./api-fetcher";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Read API Request
      </h1>

      <p className="mt-4">Read headers in an API handlers.</p>

      <div className="mt-4">
        <APIFetcher path="/http/api/request-info" />
      </div>
    </div>
  );
}
