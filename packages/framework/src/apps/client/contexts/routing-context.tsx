import { ReactNode, createContext } from "react";

export const Context = createContext({
  path: "/",
  searchParams: new URLSearchParams(),
  optimisticPath: "/",
  optimisticSearchParams: new URLSearchParams(),
  isTransitioning: false,
  navigate: (path: string) => {},
  replace: (path: string) => {},
  refresh: () => {},
  notFound: () => {},
});

export function RoutingContext({
  path,
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
  searchParams: URLSearchParams;
  optimisticPath: string;
  optimisticSearchParams: URLSearchParams;
  isTransitioning: boolean;
  navigate: (path: string) => void;
  replace: (path: string) => void;
  refresh: () => void;
  notFound: () => void;
  children: ReactNode;
}) {
  return (
    <Context.Provider
      value={{
        path,
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
    </Context.Provider>
  );
}
