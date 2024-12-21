import { Suspense } from "react";

export default async function RSCSuspendedThrowPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts />
    </Suspense>
  );
}

async function getPosts() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function Posts() {
  await getPosts();

  throw new Error("Oh no!");

  return <div>Posts...</div>;
}
