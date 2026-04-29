import Link from "@twofold/framework/link";

export default function ExternalLinkPage() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        External Link
      </h1>
      <p className="pt-3 text-gray-800">
        This page demonstrates the navigation progress bar showing up when
        clicking a link to an external URL.
      </p>
      <p className="pt-3">
        <Link href="https://www.google.com">Open Google</Link>
      </p>
    </div>
  );
}
