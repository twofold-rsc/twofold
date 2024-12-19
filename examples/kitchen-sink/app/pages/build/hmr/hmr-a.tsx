"use client";

import SharedTest from "./hmr-shared-test";

export default function HMRA() {
  return (
    <div>
      <div>HMR A</div>
      <SharedTest />
    </div>
  );
}
