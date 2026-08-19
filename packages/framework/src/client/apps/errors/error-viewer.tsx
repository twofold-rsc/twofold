import { useDevReload } from "../../hooks/use-dev-reload";

export function ErrorViewer({ error }: { error: unknown }) {
  return (
    <div className="bg-red-50 h-full">
      <div className="p-6 max-w-7xl mx-auto h-full">
        <div className="rounded shadow border border-gray-300 p-6 bg-white">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Error</h1>
          </div>
          <div className="mt-6">
            {error instanceof Error ? (
              <>
                <p data-testid="error-message" className="text-red-500 text-xl">
                  {error.message}
                </p>
                <pre className="mt-6 overflow-x-scroll pr-6 -mr-6 text-sm">
                  {error.stack}
                </pre>
              </>
            ) : (
              <p data-testid="error-message" className="text-red-500 text-xl">
                Unknown error
              </p>
            )}
          </div>
        </div>
      </div>

      <Reload />
    </div>
  );
}

function Reload() {
  useDevReload((message) => {
    if (message.type === "changes") {
      window.location.reload();
    }
  });

  return null;
}
