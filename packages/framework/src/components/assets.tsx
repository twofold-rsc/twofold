import { getStore } from "../backend/stores/rsc-store.js";
import DevReload from "./dev-reload.js";
import "server-only";

export default function Assets() {
  let { assets, env } = getStore();

  return (
    <>
      {assets.map((asset) => (
        <link rel="stylesheet" href={asset} key={asset} precedence="high" />
      ))}
      {env === "development" && <DevReload />}
    </>
  );
}
