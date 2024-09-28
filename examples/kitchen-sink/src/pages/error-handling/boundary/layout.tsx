import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "./error-boundary";

export default function BoundaryLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense>
        <div>{children}</div>
      </Suspense>
    </ErrorBoundary>
  );
}
