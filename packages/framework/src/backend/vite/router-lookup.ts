import builtServerReferences from "virtual:twofold/server-references-meta-map";

export async function lookupServerActionAppTreePath(
  id: string,
): Promise<string | undefined> {
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
