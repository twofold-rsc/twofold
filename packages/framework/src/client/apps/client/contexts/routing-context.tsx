import { ReactNode, createContext } from "react";

type NavigateOptions = {
  scroll?: boolean;
  mask?: string;
};

type ContextShape = {
  path: string;
  mask: string | undefined;
  searchParams: URLSearchParams;
  optimisticPath: string;
  optimisticSearchParams: URLSearchParams;
  isTransitioning: boolean;
  navigate: (path: string, options?: NavigateOptions) => void;
  replace: (path: string, options?: NavigateOptions) => void;
  refresh: () => void;
  notFound: () => void;
};

export const Context = createContext<ContextShape>({
  path: "/",
  mask: undefined,
  searchParams: new URLSearchParams(),
  optimisticPath: "/",
  optimisticSearchParams: new URLSearchParams(),
  isTransitioning: false,
  navigate: () => {},
  replace: () => {},
  refresh: () => {},
  notFound: () => {},
});

export function RoutingContext({
  path,
  mask,
  searchParams,
  optimisticPath,
  optimisticSearchParams,
  isTransitioning,
  navigate,
  replace,
  refresh,
  notFound,
  children,
}: {
  path: string;
  mask: string | undefined;
  searchParams: URLSearchParams;
  optimisticPath: string;
  optimisticSearchParams: URLSearchParams;
  isTransitioning: boolean;
  navigate: (path: string, options?: NavigateOptions) => void;
  replace: (path: string, options?: NavigateOptions) => void;
  refresh: () => void;
  notFound: () => void;
  children: ReactNode;
}) {
  return (
    <Context
      value={{
        path,
        mask,
        searchParams,
        optimisticPath,
        optimisticSearchParams,
        isTransitioning,
        notFound,
        navigate,
        replace,
        refresh,
      }}
    >
      {children}
    </Context>
  );
}
