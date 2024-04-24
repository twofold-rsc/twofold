import { ReactNode } from "react";
import "./global.css";
import TwofoldFramework from "@twofold/framework/twofold-framework";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html className="bg-gray-50/10">
      <head>
        <title>Landing page</title>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
      <TwofoldFramework />
    </html>
  );
}
