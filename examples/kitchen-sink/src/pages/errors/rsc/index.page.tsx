import Link from "@twofold/framework/link";

export default function ErrorsPage() {
  return (
    <div>
      <h1>RSC errors</h1>
      <ul>
        <li>
          <Link href="/errors/rsc/rsc-throw">RSC throw</Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-async-throw">RSC async throw</Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-async-reject">RSC async reject</Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-suspended-throw">
            RSC suspended throw
          </Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-no-default-export">
            RSC no default export
          </Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-layout-no-default-export">
            RSC layout no default export
          </Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-missing-import">RSC missing import</Link>
        </li>
        <li>
          <Link href="/errors/rsc/rsc-syntax-error">RSC syntax error</Link>
        </li>
        <li>
          <Link href="/errors/rsc/this-url-doesnt-exist">
            RSC page doesn't exist
          </Link>
        </li>
      </ul>
    </div>
  );
}
