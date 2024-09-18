import { APIStream } from "./api-stream";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Streaming</h1>

      <p className="mt-4">Stream responses from API handlers.</p>

      <div className="mt-4">
        <APIStream />
      </div>
    </div>
  );
}
