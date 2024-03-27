import Link from "@twofold/framework/link";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Redirected</h1>
      <p className="mt-3">You were redirected here!</p>
      <div className="mt-3">
        <Link href="/routing/redirects" className="text-blue-500 underline">
          Redirects page
        </Link>
      </div>
    </div>
  );
}
