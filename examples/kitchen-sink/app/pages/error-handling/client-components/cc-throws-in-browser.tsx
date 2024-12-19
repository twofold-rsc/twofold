"use client";

export default function CCThrowsInBrowser() {
  if (typeof window !== "undefined") {
    throw new Error("Oh no!");
  }
  return null;
}
