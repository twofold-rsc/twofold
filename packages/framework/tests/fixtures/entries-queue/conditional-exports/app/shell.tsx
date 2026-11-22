"use client";

// @ts-expect-error The test stages this package in the temporary app's node_modules.
import { variant } from "entry-variants";

export function Shell() {
  return variant;
}
