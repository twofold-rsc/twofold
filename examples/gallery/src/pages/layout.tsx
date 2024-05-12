import { ReactNode } from "react";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import "./global.css";
import { SSRSuspenseFallback } from "./ssr-suspense-fallback";
import { LayoutGroup } from "./components/layout-group";
import { AnimatePresence } from "./components/animate-presence";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html className="h-full">
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body className="h-full bg-blue-100">
        <main className="mx-auto h-full max-w-7xl px-4 py-8">
          <SSRSuspenseFallback fallback={<>Loading</>}>
            <LayoutGroup>{children}</LayoutGroup>
          </SSRSuspenseFallback>
        </main>
      </body>

      {/* This component is needed to start Twofold */}
      <TwofoldFramework />
    </html>
  );
}
