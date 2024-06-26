import { getStore } from "../backend/stores/rsc-store.js";
import DevReload from "./dev-reload.js";
import "server-only";

export default function Assets() {
  let { assets, env } = getStore();

  return (
    <>
      {assets.map((asset) => (
        <Stylesheet href={asset} key={asset} />
      ))}
      {env === "development" && <DevReload />}
    </>
  );
}

function Stylesheet({ href }: { href: string }) {
  return (
    /* @ts-ignore */
    // eslint-disable-next-line react/no-unknown-property
    <link rel="stylesheet" href={href} precedence="high" />
  );
}
