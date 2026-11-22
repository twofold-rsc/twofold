"use client";

import { save } from "../actions/save";
import { Controls } from "./controls";

export function Counter() {
  return [save, Controls];
}
