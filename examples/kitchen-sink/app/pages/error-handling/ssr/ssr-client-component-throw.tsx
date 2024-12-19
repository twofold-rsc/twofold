"use client";

export default function SSRClientComponentThrow() {
  // simulate an error during the SSR phase
  if (typeof window === "undefined") {
    throw new Error("Oh no!");
  }

  return <div>Did I render?</div>;
}
