"use client";

import { useEffect, useRef, useState } from "react";

// this file isnt used, its just to test that the linter is working

export function Component() {
  let [name, setName] = useState("bob");

  useEffect(() => {
    console.log(name);
  });
  // this will fail lint
  // }, []);

  let thingRef = useRef(1);

  // this will fail lint
  // return <div>{thingRef.current}</div>;

  return <div>hello world</div>;
}
