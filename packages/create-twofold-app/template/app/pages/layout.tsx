import TwofoldFramework from "@twofold/framework/twofold-framework";
import InterFont from "@/public/fonts/inter-var-latin.woff2";
import { Toaster } from "@/app/components/toaster";
import { LayoutProps } from "@twofold/framework/types";
import "./global.css";

export default function Layout({ children }: LayoutProps) {
  return (
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link
          rel="preload"
          href={InterFont}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="relative antialiased">
        <main className="mx-auto flex min-h-dvh max-w-7xl grow flex-col p-6">
          {children}
        </main>

        <Toaster />
      </body>

      {/* This component is needed to start Twofold */}
      <TwofoldFramework />
    </html>
  );
}
