import Link from "@twofold/framework/link";

export default function ErrorsPage() {
  return (
    <div>
      <h1>Server actions errors</h1>
      <ul>
        <li>
          <Link href="/errors/server-action/action-missing-use-server">
            Server action missing use server
          </Link>
        </li>
        <li>
          <Link href="/errors/server-action/action-throw">
            Server action throw
          </Link>
        </li>
        <li>
          <Link href="/errors/server-action/action-throw-client-catch">
            Server action throw and client catch
          </Link>
        </li>
      </ul>
    </div>
  );
}
