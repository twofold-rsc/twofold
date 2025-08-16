import { LayoutProps } from "@twofold/framework/types";
import { Reveal } from "./reveal";
import Link from "@twofold/framework/link";

export default function Layout(props: LayoutProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Router props</h1>

      <div className="mt-8 flex space-x-4">
        <Link href="/routing/props">Index</Link>
        <Link href="/routing/props/a-page-with-a-param">Param</Link>
        <Link href="/routing/props/a-page-with-a-param?search=true">
          Search params
        </Link>
      </div>

      <div className="-my-px mt-8 inline-block rounded-t bg-purple-500 px-2 py-1 text-xs text-white">
        Layout props
      </div>
      <div className="space-y-8 border border-purple-500 p-4">
        <div>
          <h2 className="font-medium">Params</h2>

          <div className="mt-1 text-gray-500">
            <ul className="list-disc pl-5">
              {Object.entries(props.params).map(([key, value]) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="font-medium">Search params</h2>
          <div className="mt-1 text-gray-500">
            {props.searchParams.size > 0
              ? props.searchParams.toString()
              : "none"}
          </div>
        </div>
        <div>
          <h2 className="font-medium">URL</h2>
          {/* <div className="mt-1 text-gray-500">{props.url}</div> */}
        </div>
        <div>
          <h2 className="font-medium">Request</h2>
          <div className="mt-1 text-gray-500">
            <Reveal>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    method: props.request.method,
                    url: props.request.url,
                    headers: Object.fromEntries(
                      props.request.headers.entries(),
                    ),
                  },
                  null,
                  2,
                )}
              </pre>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="mt-8">{props.children}</div>
    </div>
  );
}
