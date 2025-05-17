"use client";

import { createContext, ReactNode, useOptimistic, useTransition } from "react";
import { rememberCliCommand } from "./actions";

type Data = {
  command: string;
  setCommand: (command: string) => void;
};

export const Context = createContext<Data>({
  command: "pnpm",
  setCommand: () => {},
});

export function CLIProvider({
  command,
  children,
}: {
  command: string;
  children: ReactNode;
}) {
  let [optimisticCommand, setOptimisticCommand] = useOptimistic(command);
  let [isPending, startTransition] = useTransition();

  function setCommand(newCommand: string) {
    startTransition(() => {
      setOptimisticCommand(newCommand);
      rememberCliCommand(newCommand);
    });
  }

  return (
    <Context.Provider
      value={{
        command: optimisticCommand,
        setCommand,
      }}
    >
      {children}
    </Context.Provider>
  );
}
