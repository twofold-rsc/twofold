import { ReactNode } from "react";
import Assets from "@twofold/framework/assets";
import "./global.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html className="bg-gray-50/10">
      <head>
        <title>Landing page</title>
        <Assets />
      </head>
      <body>{children}</body>
    </html>
  );
}
