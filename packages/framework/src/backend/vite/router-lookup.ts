import builtServerReferences from "virtual:twofold/server-references-meta-map";
import { ModuleSurface } from "./router-types";

interface ServerActionMetadata {
  loadModule: () => Promise<ModuleSurface>;
  appPath: string;
}

export async function lookupServerActionMetadata(
  id: string,
): Promise<ServerActionMetadata | undefined> {
  id = id.split("#")[0]!;
  if (!import.meta.env.__vite_rsc_build__) {
    return (
      await import(
        /* @vite-ignore */
        `/@id/__x00__virtual:twofold/server-references-meta-map-lookup?id=${encodeURIComponent(id)}&lang.js`
      )
    ).default;
  } else {
    return builtServerReferences[id];
  }
}
