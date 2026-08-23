"use client";

import { use } from "react";
import {
  Context,
  RouteStack,
  RouteStackEntry,
} from "../../apps/client/contexts/route-stack-context";
import { RedirectError } from "../../errors/redirect-error";
import { RedirectBoundary } from "../boundaries/redirect-boundary";

export function Reader() {
  let { stack, depth } = use(Context);
  let [entry, ...rest] = stack;

  return (
    <RouteStack stack={rest} depth={depth + 1}>
      <RedirectBoundary>
        {entry ? <Entry entry={entry} /> : null}
      </RedirectBoundary>
    </RouteStack>
  );
}

function Entry({ entry }: { entry: RouteStackEntry }) {
  if (entry.type === "error") {
    throw entry.error;
  }

  if (entry.type === "redirect") {
    throw new RedirectError(entry.status, entry.url);
  }

  return entry.type === "tree" ? entry.tree : null;
}
