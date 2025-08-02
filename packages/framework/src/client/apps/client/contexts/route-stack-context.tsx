import { createContext, ReactNode } from "react";
import { RedirectBoundary } from "../boundaries/redirect-boundary";
import { Reader } from "../../../components/route-stack/reader";

type TreeEntry = {
  type: "tree";
  key: string;
  tree: any;
};

type ErrorEntry = {
  type: "error";
  error: Error;
};

export type RouteStackEntry = TreeEntry | ErrorEntry;

type ContextShape = {
  stack: RouteStackEntry[];
};

export const Context = createContext<ContextShape>({
  stack: [],
});

export function RouteStack({
  stack,
  children,
}: {
  stack: RouteStackEntry[];
  children?: ReactNode;
}) {
  return (
    <RedirectBoundary>
      <Context value={{ stack }}>{children ? children : <Reader />}</Context>
    </RedirectBoundary>
  );
}
