import { Suspense, cache } from "react";

export default async function CachePage() {
  let number = await getRandomNumber();

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Cache</h1>

      <div className="mt-4">
        <div>Random number: {number}</div>
      </div>

      <div className="mt-4">
        <Suspense fallback={<div>Loading component A...</div>}>
          <WaterfallComponent />
        </Suspense>
        <Suspense fallback={<div>Loading component B...</div>}>
          <WaterfallComponent />
        </Suspense>
      </div>
    </div>
  );
}

async function WaterfallComponent() {
  let r1 = await getRandomNumber();
  let r2 = await getRandomNumber();

  return (
    <div>
      Waterfall component loaded! [{r1}] [{r2}]
    </div>
  );
}

let getRandomNumber = cache(async () => {
  console.log("getRandomNumber called");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return Math.floor(Math.random() * 1000);
});

// export let fetchData = async () => {
//   console.log("fetchData called");
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   return "data";
// };
