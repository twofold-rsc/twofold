"use server";

export const database = { count: 0 };

export function createIncrementAction(amount: number) {
  return async function increment() {
    "use server";
    database.count = database.count + amount;
  };
}
