const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function SlowPage() {
  await sleep(1000);

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Slow Load</h1>
      <p className="pt-3 text-gray-800">
        This page takes a second to load, so you should see the navigation
        progress bar while navigating to it.
      </p>
    </div>
  );
}
