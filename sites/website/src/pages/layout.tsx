import { ReactNode } from "react";
import "./global.css";
import TwofoldFramework from "@twofold/framework/twofold-framework";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html className="bg-gray-50/10">
      <head>
        <title>Landing page</title>
        <TwofoldFramework />
      </head>
      <body>{children}</body>
    </html>
  );
}
