import { ReactNode } from "react";
import "./global.css";
import Nav from "./nav";
import TwofoldFramework from "@twofold/framework/twofold-framework";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html className="bg-gray-50/10">
      <head>
        <title>Kitchen sink</title>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body className="subpixel-antialiased">
        <div>
          <Nav />
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>

      <TwofoldFramework />
    </html>
  );
}
