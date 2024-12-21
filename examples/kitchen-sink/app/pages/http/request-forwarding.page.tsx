import { PageProps } from "@twofold/framework/types";

export default function RequestForwardingPage({ request }: PageProps) {
  let url = new URL(request.url);
  let headers = request.headers;

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Request forwarding
      </h1>
      <p className="pt-3 text-gray-800">
        Requests passed to pages from proxies and load balancers will have the
        correct url, host, and protocol.
      </p>
      <div className="space-y-4 pt-4">
        <div>
          <div className="text-sm text-gray-500">Request URL</div>
          <div>{request.url}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Forwarded host</div>
          <div>{headers.get("x-forwarded-host") ?? "None"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">URL host</div>
          <div>{url.host}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Forwarded protocol</div>
          <div>{headers.get("x-forwarded-proto") ?? "None"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">URL protocol</div>
          <div>{url.protocol}</div>
        </div>
      </div>
    </div>
  );
}
