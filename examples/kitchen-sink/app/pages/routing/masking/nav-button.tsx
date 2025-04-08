"use client";

import { useRouter } from "@twofold/framework/use-router";

export function NavButton({ number }: { number: number }) {
  let router = useRouter();

  return (
    <div>
      <button
        className="text-blue-500 hover:text-blue-500 hover:underline"
        onClick={() => {
          router.navigate(`/routing/masking?number=${number}`, {
            mask: `/routing/masking/${number}`,
          });
        }}
      >
        Number {number}
      </button>
    </div>
  );
}
