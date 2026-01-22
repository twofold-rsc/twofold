"use client";

import Link from "@twofold/framework/link";

export default function CustomUnauthorizedPage() {
  return (
    <div>
      <div>This is a custom unauthorized page.</div>
      <div className="mt-4">
        <Link href="/routing/unauthorized" className="text-blue-500 underline">
          Unauthorized index
        </Link>
      </div>
    </div>
  );
}
