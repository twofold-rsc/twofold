import { ReactNode } from "react";
import "./global.css";
import TwofoldFramework from "@twofold/framework/twofold-framework";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <title>Twofold RSC</title>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>

      {/* This component is needed to start the Twofold framework. */}
      <TwofoldFramework />
    </html>
  );
}
