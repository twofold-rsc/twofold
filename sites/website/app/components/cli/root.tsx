import { ReactNode } from "react";
import { CLIProvider } from "./provider";
import cookies from "@twofold/framework/cookies";

export function CLIRoot({ children }: { children: ReactNode }) {
  let command = cookies.get("cli-command") ?? "pnpm";

  return <CLIProvider command={command}>{children}</CLIProvider>;
}
