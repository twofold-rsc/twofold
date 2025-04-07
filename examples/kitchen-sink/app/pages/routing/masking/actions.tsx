"use server";

export const state = {
  count: 0,
};

export async function getRandomNumber() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return Math.floor(Math.random() * 100);
}

export async function incrementCount() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  state.count += 1;
}
