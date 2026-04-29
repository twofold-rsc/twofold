import type { FunctionComponent } from "react";
import type { ReactFormState } from "react-dom/client";
import type { LayoutProps, PageProps } from "../../types/importable";
import type { RscActionPayload } from "./entrypoint/payload";

export enum MiddlewareMode {
  Run,
  Skip,
}

export interface ModuleSurface {
  default?: FunctionComponent<
    LayoutProps | PageProps<any> | { error: unknown }
  >;
  before?: (props: any) => Promise<void>;
  GET?: (req: Request) => Promise<Response>;
  POST?: (req: Request) => Promise<Response>;
  [key: string | symbol]: any | undefined;
}

export type ModuleMap = {
  [path: string]: () => Promise<ModuleSurface>;
};

export class ActionResultData {
  returnValue: RscActionPayload | undefined;
  actionStatus: number | undefined;
  formState: ReactFormState | undefined;
  temporaryReferences: unknown | undefined;
  response: Response | undefined;
  error: unknown | undefined;
}
