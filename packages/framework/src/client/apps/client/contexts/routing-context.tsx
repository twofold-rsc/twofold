import { ReactNode, createContext } from "react";

type NavigateOptions = {
  scroll?: boolean;
  mask?: string;
};

type ContextShape = {
  version: number;
  path: string;
  mask: string | undefined;
  searchParams: URLSearchParams;
  optimisticPath: string;
  optimisticSearchParams: URLSearchParams;
  isTransitioning: boolean;
  navigate: (path: string, options?: NavigateOptions) => void;
  replace: (path: string, options?: NavigateOptions) => void;
  refresh: () => void;
};

export const Context = createContext<ContextShape>({
  version: 0,
  path: "/",
  mask: undefined,
  searchParams: new URLSearchParams(),
  optimisticPath: "/",
  optimisticSearchParams: new URLSearchParams(),
  isTransitioning: false,
  navigate: () => {},
  replace: () => {},
  refresh: () => {},
});

export function RoutingContext({
  version,
  path,
  mask,
  searchParams,
  optimisticPath,
  optimisticSearchParams,
  isTransitioning,
  navigate,
  replace,
  refresh,
  children,
}: {
  version: number;
  path: string;
  mask: string | undefined;
  searchParams: URLSearchParams;
  optimisticPath: string;
  optimisticSearchParams: URLSearchParams;
  isTransitioning: boolean;
  navigate: (path: string, options?: NavigateOptions) => void;
  replace: (path: string, options?: NavigateOptions) => void;
  refresh: () => void;
  children: ReactNode;
}) {
  return (
    <Context
      value={{
        version,
        path,
        mask,
        searchParams,
        optimisticPath,
        optimisticSearchParams,
        isTransitioning,
        navigate,
        replace,
        refresh,
      }}
    >
      {children}
    </Context>
  );
}
