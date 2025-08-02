export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return <div className="border border-green-500 p-4">Page</div>;
}
