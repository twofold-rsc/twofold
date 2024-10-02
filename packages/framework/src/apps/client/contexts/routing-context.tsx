import { ReactNode, createContext } from "react";

export const Context = createContext({
  path: "/",
  searchParams: new URLSearchParams(),
  navigate: (path: string) => {},
  replace: (path: string) => {},
  refresh: () => {},
  notFound: () => {},
});

export function RoutingContext({
  path,
  searchParams,
  navigate,
  replace,
  refresh,
  notFound,
  children,
}: {
  path: string;
  searchParams: URLSearchParams;
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
