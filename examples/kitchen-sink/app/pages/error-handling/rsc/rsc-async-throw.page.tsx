async function getPosts() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  throw new Error("Oh no!");
}

export default async function RSCAsyncThrowPage() {
  await getPosts();

  return <div>Oh no!</div>;
}
