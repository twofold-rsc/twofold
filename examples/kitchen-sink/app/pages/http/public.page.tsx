export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Public</h1>

      <ul className="mt-4 list-disc pl-4">
        <li>
          <a href="/static.txt">static.txt</a>
        </li>
        <li>
          <a href="/nested-folder/nested-static.txt">nested-static.txt</a>
        </li>
        <li>
          <a href="/logo.png">logo.png</a>
        </li>
      </ul>
    </div>
  );
}
