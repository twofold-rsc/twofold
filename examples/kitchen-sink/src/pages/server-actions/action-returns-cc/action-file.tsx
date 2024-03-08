"use server";

import ClientComponent from "./client-component";

export default async function action() {
  console.log("i run on the server!");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <ClientComponent />;
}
