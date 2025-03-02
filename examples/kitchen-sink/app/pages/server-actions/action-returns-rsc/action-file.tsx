"use server";

import { ReactNode } from "react";

async function TimeComponent() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <p>It is {new Date().toString()} on the server</p>;
}

async function BlueComponent({ children }: { children: ReactNode }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div className="bg-blue-500 px-3 py-1.5 text-blue-50">{children}</div>;
}

export async function getTimeComponent() {
  return <TimeComponent />;
}

export async function getBlueComponent(children: ReactNode) {
  return <BlueComponent>{children}</BlueComponent>;
}
