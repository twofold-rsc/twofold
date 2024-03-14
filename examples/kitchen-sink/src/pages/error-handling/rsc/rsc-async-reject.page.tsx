async function getPosts() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Oh no!"));
    }, 1000);
  });
}

export default async function RSCAsyncRejectPage() {
  await getPosts();

  return <div>Oh no!</div>;
}
