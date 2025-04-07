import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import { SelectedNumber } from "./selected-number";
import { NavButton } from "./nav-button";

export default function MaskingPage({ searchParams }: PageProps) {
  let queryParam = searchParams.get("number");
  let number = queryParam ? parseInt(queryParam) : null;

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Route masking</h1>
      <p className="mt-3">
        This page renders the clicked links with route masks.
      </p>
      <div className="flex space-x-16">
        <ul className="mt-4 ml-4 shrink-0 list-disc">
          <li>
            <Link
              href="/routing/masking?number=1"
              mask="/routing/masking/1"
              className="text-blue-500 hover:underline"
            >
              Number 1
            </Link>
          </li>

          <li>
            <Link
              href="/routing/masking?number=2"
              mask="/routing/masking/2"
              className="text-blue-500 hover:underline"
            >
              Number 2
            </Link>
          </li>

          <li>
            <Link
              href="/routing/masking?number=3"
              mask="/routing/masking/3"
              className="text-blue-500 hover:underline"
            >
              Number 3
            </Link>
          </li>

          <li>
            <NavButton number={4} />
          </li>

          <li>
            <Link
              href="/routing/masking"
              className="text-blue-500 hover:underline"
            >
              Clear
            </Link>
          </li>
        </ul>

        <div className="mt-4 w-full">
          {number ? (
            <SelectedNumber number={number} />
          ) : (
            <p className="text-gray-500">
              No number selected. Click on a number to select it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
