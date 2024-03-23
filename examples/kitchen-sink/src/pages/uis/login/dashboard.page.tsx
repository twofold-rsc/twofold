import cookies from "@twofold/framework/cookies";
import Link from "@twofold/framework/link";
import { notFound } from "@twofold/framework/not-found";

export function before() {
  if (cookies.get("auth") !== "true") {
    notFound();
  }
}

export default function Page() {
  return (
    <div>
      <div>Welcome to the dashboard page!</div>
      <div className="mt-4">
        <Link href="/uis/login" className="text-blue-500 hover:underline">
          Logout
        </Link>
      </div>
    </div>
  );
}
