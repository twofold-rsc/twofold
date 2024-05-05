import { ReactNode } from "react";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import "./global.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>

      {/* This component is needed to start Twofold */}
      <TwofoldFramework />
    </html>
  );
}
