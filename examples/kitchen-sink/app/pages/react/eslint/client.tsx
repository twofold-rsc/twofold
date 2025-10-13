"use client";

import { useEffect, useRef, useState } from "react";

// this file isnt used, its just to test that the linter is working

export function Component() {
  let [name, setName] = useState("bob");

  useEffect(() => {
    console.log(name);
  }, []);

  let thingRef = useRef(1);

  return <div>{thingRef.current}</div>;
}
