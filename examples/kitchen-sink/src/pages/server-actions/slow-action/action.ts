"use server";

export async function action() {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return new Date().toString();
}
