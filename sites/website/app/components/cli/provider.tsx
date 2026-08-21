"use client";

import {
  createContext,
  ReactNode,
  startTransition,
  useOptimistic,
} from "react";
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

  function setCommand(newCommand: string) {
    startTransition(async () => {
      setOptimisticCommand(newCommand);
      await rememberCliCommand(newCommand);
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
