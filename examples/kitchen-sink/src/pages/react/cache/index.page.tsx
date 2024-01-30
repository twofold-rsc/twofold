import { Suspense, cache } from "react";

export default async function CachePage() {
  await fetchData();

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Cache</h1>

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

  return <div>I finally loaded!</div>;
}

let fetchData = cache(async () => {
  console.log("fetchData called");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "data";
});

// export let fetchData = async () => {
//   console.log("fetchData called");
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   return "data";
// };
