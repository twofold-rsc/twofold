import Link from "@twofold/framework/link";

export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Suspense</h1>

      <div className="mt-4 space-y-4">
        <div className="h-[2000px] bg-gradient-to-b from-gray-100 to-gray-500"></div>

        <div>
          <Link href="/routing/scroll-position/html">Go to HTML</Link>
        </div>
      </div>
    </div>
  );
}
