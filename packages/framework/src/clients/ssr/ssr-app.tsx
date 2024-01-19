import { use } from "react";
import { RoutingContext } from "../shared/routing-context";
import { StreamContext } from "../shared/stream-context";

export function SSRApp({
  path,
  tree,
  rscStreamReader,
}: {
  path: string;
  tree: any;
  rscStreamReader: ReadableStreamDefaultReader<Uint8Array>;
}) {
  let navigate = (path: string) => {
    throw new Error("Cannot call navigate during SSR");
  };

  let refresh = () => {
    throw new Error("Cannot call refresh during SSR");
  };

  return (
    <RoutingContext path={path} navigate={navigate} refresh={refresh}>
      <StreamContext reader={rscStreamReader}>{use(tree)}</StreamContext>
    </RoutingContext>
  );
}
