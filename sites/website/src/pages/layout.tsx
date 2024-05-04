import { ReactNode } from "react";
import "./global.css";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import { EnterDocs } from "./contexts/enter-docs";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html className="h-full bg-gray-50/10 antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <EnterDocs className="flex flex-col grow">{children}</EnterDocs>
      </body>
      <TwofoldFramework />
    </html>
  );
}
