"use client";

import SharedTest from "./hmr-shared-test";

export default function HMRB() {
  return (
    <div>
      <div>HMR B</div>
      <SharedTest />
    </div>
  );
}
