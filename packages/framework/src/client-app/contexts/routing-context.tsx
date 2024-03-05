import { ReactNode, createContext } from "react";

export const Context = createContext({
  path: "/",
  navigate: (path: string) => {},
  refresh: () => {},
});

export function RoutingContext({
  path,
  navigate,
  refresh,
  children,
}: {
  path: string;
  navigate: (path: string) => void;
  refresh: () => void;
  children: ReactNode;
}) {
  return (
    <Context.Provider value={{ path, navigate, refresh }}>
      {children}
    </Context.Provider>
  );
}
