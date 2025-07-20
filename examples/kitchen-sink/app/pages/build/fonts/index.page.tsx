import Orbitron from "./orbitron.woff2";
import PressStart2P from "@/public/fonts/press-start-2p.woff2";
import "./local-font.css";
import "./global-font.css";

export default function AssetsPage() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Font imports</h1>

      <link
        rel="preload"
        href={Orbitron}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      <link
        rel="preload"
        href={PressStart2P}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      <div className="mt-8 space-y-1">
        <div className="font-medium">Local font</div>
        <div className="orbitron-font text-3xl">This is a test.</div>
        <div className="mt-1 text-sm text-gray-500">Font: {Orbitron}</div>
      </div>

      <div className="mt-8 space-y-1">
        <div className="font-medium">Global font</div>
        <div className="press-start-2p-font text-3xl">This is a test.</div>
        <div className="mt-1 text-sm text-gray-500">Font: {PressStart2P}</div>
      </div>
    </div>
  );
}
