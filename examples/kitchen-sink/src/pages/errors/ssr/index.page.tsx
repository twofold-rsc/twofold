import Link from "@twofold/framework/link";

export default function ErrorsPage() {
  return (
    <div>
      <h1>SSR errors</h1>
      <ul>
        <li>
          <Link href="/errors/ssr/ssr-throw">SSR throw</Link>
        </li>
      </ul>
    </div>
  );
}
