import ogs from "open-graph-scraper";

export default async function Page() {
  let { result } = await ogs({ url: "https://buildui.com" });

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Externals</h1>

      <div className="mt-8">
        <p>Package: Open Graph Scraper</p>
        <pre className="mt-3 text-xs text-gray-600">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
