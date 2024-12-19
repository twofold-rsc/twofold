export async function before(props: {
  params: Record<string, string | undefined>;
  searchParams: URLSearchParams;
  request: Request;
}) {
  console.log({
    params: props.params,
    searchParams: props.searchParams,
    requestUrl: props.request.url,
  });
}

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Middleware props
      </h1>

      <p className="mt-4">
        This page uses middleware to log to the page props before rendering.
      </p>
    </div>
  );
}
