"use server";

import ClientComponent from "./client-component";

export default async function action() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <ClientComponent />;
}
