import { ReactNode, createContext } from "react";

export const Context = createContext({
  path: "/",
  navigate: (path: string) => {},
  replace: (path: string) => {},
  refresh: () => {},
  notFound: () => {},
});

export function RoutingContext({
  path,
  navigate,
  replace,
  refresh,
  notFound,
  children,
}: {
  path: string;
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
