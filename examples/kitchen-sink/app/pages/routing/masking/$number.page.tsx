import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import { SelectedNumber } from "./selected-number";
import { notFound } from "@twofold/framework/not-found";

export default function MaskingPage({ params }: PageProps<"number">) {
  const number = parseInt(params.number);

  if (isNaN(number)) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Route masking</h1>
      <p className="mt-3">
        This page renders the clicked links without route masks.
      </p>
      <div className="mt-4">
        <SelectedNumber number={number} />
      </div>

      <div className="mt-4">
        <Link
          href="/routing/masking"
          className="text-sm text-gray-500 hover:underline"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
