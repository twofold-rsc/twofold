"use client";

import { useId } from "react";

export default function UseIdCC() {
  let id = useId();
  return <div>id: {id}</div>;
}
