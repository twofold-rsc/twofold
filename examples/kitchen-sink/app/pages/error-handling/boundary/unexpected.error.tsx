"use client";

export default function UnexpectedError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return <div>there was an error: {message}</div>;
}
