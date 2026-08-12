import Link from "@twofold/framework/link";

export default function StartPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Back start</h1>
      <div className="mt-3">
        <Link className="text-blue-500 underline" href="/routing/back/end">
          Go to end
        </Link>
      </div>
    </div>
  );
}
