import { ReactNode } from "react";
import { NotFoundBoundary } from "./not-found-boundary";

export default function InnerRootWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <NotFoundBoundary>{children}</NotFoundBoundary>;
}
