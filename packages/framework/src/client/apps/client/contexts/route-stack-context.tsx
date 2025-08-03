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
  depth: number;
};

export const Context = createContext<ContextShape>({
  stack: [],
  depth: 0,
});

export function RouteStack({
  stack,
  children,
  depth = 0,
}: {
  stack: RouteStackEntry[];
  children?: ReactNode;
  depth?: number;
}) {
  return (
    <Context
      value={{
        stack,
        depth,
      }}
    >
      {children ? children : <Reader />}
    </Context>
  );
}
