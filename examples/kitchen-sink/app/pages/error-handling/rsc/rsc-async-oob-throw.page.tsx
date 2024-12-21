async function getPosts() {
  return await new Promise((resolve, reject) => {
    setTimeout(() => {
      throw new Error("Oh no!");
    }, 1000);
  });
}

export default async function RSCAsyncOOBThrowPage() {
  await getPosts();

  return <div>Oh no!</div>;
}
