import { ReactNode, createContext } from "react";

export const Context =
  createContext<ReadableStreamDefaultReader<Uint8Array> | null>(null);

export function StreamContext({
  reader,
  children,
}: {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  children: ReactNode;
}) {
  return <Context.Provider value={reader}>{children}</Context.Provider>;
}
