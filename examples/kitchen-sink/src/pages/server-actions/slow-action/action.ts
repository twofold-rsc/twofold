"use server";

export async function action() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return new Date().toString();
}
