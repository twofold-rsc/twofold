import { createContext, ReactNode } from "react";

export type Segment = {
  path: string;
  type: string;
  tree: any;
};

type ContextShape = {
  segments: Segment[];
};

export const Context = createContext<ContextShape>({
  segments: [],
});

export function SegmentContext({
  segments,
  children,
}: {
  segments: Segment[];
  children: ReactNode;
}) {
  return <Context value={{ segments }}>{children}</Context>;
}
