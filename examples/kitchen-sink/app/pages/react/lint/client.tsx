"use client";

import { useEffect, useRef, useState } from "react";

export function Component() {
  let [name, setName] = useState("bob");

  useEffect(() => {
    console.log(name);
    // lint-error-on
    // }, []);
    // lint-error-off
  });
  let thingRef = useRef(1);

  // lint-error-on
  // return <div data-testid="lint-output">{thingRef.current}</div>;
  // lint-error-off
  return <div data-testid="lint-output">hello world</div>;
}
