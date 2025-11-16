import { ReactNode } from "react";
import "./global.css";
import InterFont from "@/public/fonts/inter-var-latin.woff2";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import { EnterDocs } from "./enter-docs";
import FavIcon from "@/public/favicon.png";

export default function Layout({
  children,
  request,
}: {
  children: ReactNode;
  request: Request;
}) {
  return (
    <html className="h-full bg-white antialiased" lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href={FavIcon} />
        <link
          rel="preload"
          href={InterFont}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>

      <body className="flex min-h-full flex-col">
        <EnterDocs className="flex grow flex-col">{children}</EnterDocs>
      </body>

      <TwofoldFramework />
    </html>
  );
}
