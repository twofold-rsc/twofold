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
          <div data-testid="request-url">{request.url}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Forwarded host</div>
          <div data-testid="forwarded-host">
            {headers.get("x-forwarded-host") ?? "None"}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">URL host</div>
          <div data-testid="url-host">{url.host}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Forwarded protocol</div>
          <div data-testid="forwarded-protocol">
            {headers.get("x-forwarded-proto") ?? "None"}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">URL protocol</div>
          <div data-testid="url-protocol">{url.protocol}</div>
        </div>
      </div>
    </div>
  );
}
