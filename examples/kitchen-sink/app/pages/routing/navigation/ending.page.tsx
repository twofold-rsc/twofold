import Link from "@twofold/framework/link";

export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return (
    <div>
      <p>Ending navigation page</p>
      <div className="mt-3">
        <Link className="text-blue-500 underline" href="/routing/navigation">
          Return to index
        </Link>
      </div>
    </div>
  );
}
