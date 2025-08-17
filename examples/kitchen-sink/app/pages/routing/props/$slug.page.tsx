import { PageProps } from "@twofold/framework/types";
import { Reveal } from "./reveal";

export default function SlugPropsPage(props: PageProps<"slug">) {
  return (
    <div>
      <div className="-my-px inline-block rounded-t bg-blue-500 px-2 py-1 text-xs text-white">
        Page props
      </div>
      <div className="space-y-8 border border-blue-500 p-4">
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
            {props.searchParams.size === 0 ? (
              <>none</>
            ) : (
              <ul className="list-disc pl-5">
                {props.searchParams.entries().map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-medium">URL</h2>
          <div className="mt-1 text-gray-500">{props.url.toString()}</div>
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
    </div>
  );
}
