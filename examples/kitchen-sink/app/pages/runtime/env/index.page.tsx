import ClientComponent from "./client-component";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">ENV</h1>
      <p className="mt-3">
        Ensure ENVs are only available on the server and not on the client.
      </p>

      <div className="mt-3">
        <div className="-mb-0.5 inline-flex rounded-t bg-purple-500 px-2 py-1 text-white">
          Server component
        </div>
        <div className="rounded border-2 border-dashed border-purple-500 p-4">
          <div>
            <div className="font-mono text-sm font-bold">
              process.env.NODE_ENV
            </div>
            <div className="mt-1 text-purple-500">{process.env.NODE_ENV}</div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-sm font-bold">
              process.env.KITCHEN_SINK_TEST_ENV
            </div>
            <div className="mt-1 text-purple-500">
              {process.env.KITCHEN_SINK_TEST_ENV}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ClientComponent />
      </div>
    </div>
  );
}
