import Link from "@twofold/framework/link";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Scroll Position
      </h1>

      <div className="mt-4 space-y-4">
        <p>Here's a long blue box.</p>

        <div className="h-[2000px] bg-gradient-to-b from-blue-100 to-blue-500"></div>

        <div>
          <Link href="/routing/scroll-position/text">Go to Text</Link>
        </div>
      </div>
    </div>
  );
}
