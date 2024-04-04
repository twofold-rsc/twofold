import { ReactNode } from "react";
import { ErrorBoundary } from "./error-boundary";

export default function BoundaryLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div>{children}</div>
    </ErrorBoundary>
  );
}
