"use server";

import cookies from "@twofold/framework/cookies";
import { redirect } from "@twofold/framework/redirect";
import * as z from "zod";

export async function login(formData: FormData) {
  await new Promise((resolve) => setTimeout(resolve, 750));

  let loginSchema = z.object({
    email: z.email().min(1, { message: "Email is required" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  });

  let result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    let errors = result.error.issues.map(
      (error) => `${error.path.join(".")}: ${error.message}`,
    );
    return {
      errors,
    };
  }

  let { email, password } = result.data;

  if (email === "email@example.com" && password === "password") {
    await cookies.encrypted.set("auth", true);
    redirect("/uis/login/dashboard");
  } else {
    return {
      email,
      password,
      errors: ["Invalid email and password"],
    };
  }
}
