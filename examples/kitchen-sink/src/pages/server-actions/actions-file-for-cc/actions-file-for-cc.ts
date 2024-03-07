"use server";

export async function action() {
  console.log(
    "an action (imported by a client component) running on the server",
  );
}
