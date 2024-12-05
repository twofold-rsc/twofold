"use server";

import { bucket } from "./shared";

export async function action() {
  bucket.count = bucket.count + 1;
}
