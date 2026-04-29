import { type ReactFormState } from "react-dom/client";
import type { RouteStackEntry } from "../../../client/apps/client/contexts/route-stack-context.js";

export type RscActionPayload =
  | {
      type: "return";
      result: unknown;
    }
  | {
      type: "throw";
      error: Error;
    };

export type RscPayload = {
  stack: RouteStackEntry[];
  path: string;
  action: RscActionPayload | undefined;
  formState: ReactFormState | undefined;
};
