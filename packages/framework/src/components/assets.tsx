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
    // @ts-expect-error: Type '{ rel: string; href: string; precedence: string; }' is not assignable to type 'DetailedHTMLProps<LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>'.
    <link rel="stylesheet" href={href} precedence="high" />
  );
}
