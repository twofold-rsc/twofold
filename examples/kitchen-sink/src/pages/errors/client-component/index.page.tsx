import Link from "@twofold/framework/link";

export default function ErrorsPage() {
  return (
    <div>
      <h1>Client component errors</h1>
      <ul>
        <li>
          <Link href="/errors/client-component/cc-throws-in-browser">
            Client browser error
          </Link>
        </li>
        <li>
          <Link href="/errors/client-component/cc-import-error">
            Client import error
          </Link>
        </li>
        <li>
          <Link href="/errors/client-component/cc-syntax-error">
            Client syntax error
          </Link>
        </li>
      </ul>
    </div>
  );
}
