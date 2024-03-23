import cookies from "@twofold/framework/cookies";
import { notFound } from "@twofold/framework/not-found";
import { redirect } from "@twofold/framework/redirect";

export function before() {
  if (cookies.get("auth") !== "true") {
    notFound();
  }
}

async function logout() {
  "use server";
  cookies.destroy("auth");
  redirect("/uis/login");
}

export default function Page() {
  return (
    <div>
      <div>Welcome to the dashboard page!</div>
      <div className="mt-4">
        <form action={logout}>
          <button type="submit" className="text-blue-500 hover:underline">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
