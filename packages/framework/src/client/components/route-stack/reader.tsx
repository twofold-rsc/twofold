"use client";

import { use } from "react";
import {
  Context,
  RouteStack,
  RouteStackEntry,
} from "../../apps/client/contexts/route-stack-context";

export function Reader() {
  let { stack } = use(Context);
  let [entry, ...rest] = stack;

  // setup entry specific boundaries here in this tree so
  // they can catch from the Entry component

  return (
    <RouteStack stack={rest}>
      {entry ? <Entry entry={entry} /> : null}
    </RouteStack>
  );
}

function Entry({ entry }: { entry: RouteStackEntry }) {
  if (entry.type === "error") {
    throw entry.error;
  }

  return entry.type === "tree" ? entry.tree : null;
}
