import { ReactNode } from "react";
import { NotFoundBoundary } from "./not-found-boundary";
import { RedirectBoundary } from "./redirect-boundary";

export default function InnerRootWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NotFoundBoundary>
      <RedirectBoundary>{children}</RedirectBoundary>
    </NotFoundBoundary>
  );
}
