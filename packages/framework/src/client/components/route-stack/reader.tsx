"use client";

import { Fragment, use } from "react";
import {
  Context,
  RouteStack,
  RouteStackEntry,
} from "../../apps/client/contexts/route-stack-context";
import { RedirectBoundary } from "../boundaries/redirect-boundary";
import { NotFoundBoundary } from "../boundaries/not-found-boundary";

export function Reader() {
  let { stack, depth } = use(Context);
  let [entry, ...rest] = stack;

  // setup entry specific boundaries here in this tree so
  // they can catch from the Entry component

  const WrapperBoundaries = depth === 1 ? NotFoundBoundary : Fragment;

  return (
    <RouteStack stack={rest} depth={depth + 1}>
      <RedirectBoundary>
        <WrapperBoundaries>
          {entry ? <Entry entry={entry} /> : null}
        </WrapperBoundaries>
      </RedirectBoundary>
    </RouteStack>
  );
}

function Entry({ entry }: { entry: RouteStackEntry }) {
  if (entry.type === "error") {
    throw entry.error;
  }

  return entry.type === "tree" ? entry.tree : null;
}
