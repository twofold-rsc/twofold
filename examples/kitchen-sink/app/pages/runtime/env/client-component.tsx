"use client";

export default function ClientComponent() {
  return (
    <div>
      <div className="-mb-0.5 inline-flex rounded-t bg-sky-500 px-2 py-1 text-white">
        Client component
      </div>
      <div className="rounded border-2 border-dashed border-sky-500 p-4">
        <div>
          <div className="font-mono text-sm font-bold">
            process.env.NODE_ENV
          </div>
          <div className="mt-1 text-sky-500" data-testid="client-node-env-value">
            {process.env.NODE_ENV}
          </div>
        </div>
        <div className="mt-3">
          <div className="font-mono text-sm font-bold">
            process.env.KITCHEN_SINK_TEST_ENV
          </div>
          <div className="mt-1 text-sky-500" data-testid="client-env-value">
            {typeof process !== "undefined" &&
            process.env.KITCHEN_SINK_TEST_ENV ? (
              process.env.KITCHEN_SINK_TEST_ENV
            ) : (
              <span className="italic text-gray-500">Not set</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
