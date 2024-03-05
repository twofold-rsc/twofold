import { getStore } from "../backend/store.js";
import DevReload from "./dev-reload.js";
import "server-only";

export default function Assets() {
  let { assets } = getStore();

  return (
    <>
      {assets.map((asset) => (
        <Stylesheet href={asset} key={asset} />
      ))}
      <DevReload />
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
