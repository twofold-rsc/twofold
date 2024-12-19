import cookies from "@twofold/framework/cookies";
import { LoginForm } from "./login-form";
import { redirect } from "@twofold/framework/redirect";

export function before() {
  if (cookies.get("auth")) {
    redirect("/uis/login/dashboard");
  }
}

export default function Page() {
  return (
    <div>
      <div className="max-w-prose">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tighter">Login</h1>

        <p className="text-gray-900">
          Demo login page that uses a server action to validate credentials, set
          a cookie, and redirect to an authenticated page.
        </p>

        <p className="mt-3 text-gray-900">
          To login, use the email address{" "}
          <span className="font-bold">email@example.com</span> and the password{" "}
          <span className="font-bold">password</span>.
        </p>

        <div className="mt-4">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
