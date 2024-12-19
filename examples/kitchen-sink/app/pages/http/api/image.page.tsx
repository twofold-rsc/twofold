export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Image</h1>

      <p className="mt-4">Return an image from an API handler.</p>

      <div className="mt-4">
        <img src="/http/api/image" />
      </div>
    </div>
  );
}
