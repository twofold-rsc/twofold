import cookies from "@twofold/framework/cookies";
import { LoginForm } from "./login-form";
import { z } from "zod";
import { redirect } from "@twofold/framework/redirect";

export function before() {
  cookies.destroy("auth");
}

async function login(formData: FormData) {
  "use server";

  await new Promise((resolve) => setTimeout(resolve, 750));

  let loginSchema = z.object({
    email: z.string().email().min(1, { message: "Email is required" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  });

  let result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    let errors = result.error.errors.map((error) => error.message);
    return { errors };
  }

  let { email, password } = result.data;

  if (email === "email@example.com" && password === "password") {
    cookies.set("auth", "true");
    redirect("/uis/login/dashboard");
  } else {
    return {
      errors: ["Invalid email and password"],
    };
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
          <LoginForm action={login} />
        </div>
      </div>
    </div>
  );
}
