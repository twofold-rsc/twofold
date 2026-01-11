"use client";

import Link from "@twofold/framework/link";

export default function CustomNotFoundError() {
  return (
    <div>
      <div>This is a custom not found error</div>
      <div className="mt-4">
        <Link href="/routing/not-found" className="text-blue-500 underline">
          Go back to not found index
        </Link>
      </div>
    </div>
  );
}
