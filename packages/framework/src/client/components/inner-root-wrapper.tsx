import { ReactNode } from "react";

export default function InnerRootWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // return <NotFoundBoundary>{children}</NotFoundBoundary>;
  return children;
}
