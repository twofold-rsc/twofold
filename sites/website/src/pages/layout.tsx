import { ReactNode } from "react";
import "./global.css";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import { EnterDocs } from "./contexts/enter-docs";

export default function Layout({
  children,
  request,
}: {
  children: ReactNode;
  request: Request;
}) {
  let url = new URL(request.url);
  let ogImageUrl = new URL("/og-image.png", url.origin);

  return (
    <html className="h-full bg-gray-50/10 antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />

        <meta property="og:site_name" content="Twofold" />
        <meta property="og:title" content="Twofold" />
        <meta property="og:image" content={ogImageUrl.href} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Twofold" />
        <meta name="twitter:image" content={ogImageUrl.href} />

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
      <body className="flex min-h-full flex-col">
        <EnterDocs className="flex grow flex-col">{children}</EnterDocs>
      </body>
      <TwofoldFramework />
    </html>
  );
}
