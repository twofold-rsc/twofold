"use client";

import { useRouter } from "@twofold/framework/use-router";

export function RefreshPage() {
  let router = useRouter();
  let searchParams = router.searchParams.toString();

  function handleClick() {
    router.refresh();
  }

  return (
    <div>
      <div>
        <p>
          <span className="font-mono">path</span>:{" "}
          <span className="text-gray-500">
            {router.path}
            {searchParams ? `?${searchParams}` : ""}
          </span>
        </p>
        <p>
          <span className="font-mono">mask</span>:{" "}
          <span className="text-gray-500">{router.mask}</span>
        </p>
      </div>
      <div className="mt-4">
        <button
          onClick={handleClick}
          className="text-blue-500 hover:text-blue-500 hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
