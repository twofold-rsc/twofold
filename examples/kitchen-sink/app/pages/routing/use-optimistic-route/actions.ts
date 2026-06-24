"use server";

export let data = { count: 0 };

export async function slowIncrement() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  data.count += 1;
}
