import { Suspense, cache } from "react";

export default async function CachePage() {
  await fetchData();
  await fetchMoreData();

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Multiple cache
      </h1>

      <div className="mt-4">
        <Suspense fallback={<div>Loading component...</div>}>
          <WaterfallComponent />
        </Suspense>
      </div>
    </div>
  );
}

async function WaterfallComponent() {
  await fetchData();
  await fetchMoreData();

  return <div>I finally loaded!</div>;
}

let fetchMoreData = cache(async () => {
  console.log("fetchMoreData called");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "more data";
});

let fetchData = cache(async () => {
  console.log("fetchData called");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "data";
});
