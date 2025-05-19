"use server";

import cookies from "@twofold/framework/cookies";

export async function rememberCliCommand(command: string) {
  cookies.set("cli-command", command, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });
}
