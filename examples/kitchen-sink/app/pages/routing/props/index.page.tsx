import { PageProps } from "@twofold/framework/types";

export default function RouterPage(props: PageProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Router</h1>
      <div className="mt-8">
        <h2 className="font-medium">Params</h2>
        <div className="mt-1 text-gray-500">none</div>
      </div>
      <div className="mt-8">
        <h2 className="font-medium">Search params</h2>
        <div className="mt-1 text-gray-500">
          {props.searchParams.size > 0 ? props.searchParams.toString() : "none"}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="font-medium">URL</h2>
        {/* <div className="mt-1 text-gray-500">{props.url}</div> */}
      </div>
      <div className="mt-8">
        <h2 className="font-medium">Request</h2>
        <div className="mt-1 text-gray-500">
          {/* print the request object  */}
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(
              {
                method: props.request.method,
                url: props.request.url,
                headers: Object.fromEntries(props.request.headers.entries()),
              },
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
