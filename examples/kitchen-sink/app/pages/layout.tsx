import "./global.css";
import Nav from "./nav";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import { LayoutProps } from "@twofold/framework/types";
import { Toaster } from "./toaster";
import { ProgressBar } from "react-transition-progress";

export default function Layout({ children }: LayoutProps) {
  return (
    <html className="bg-white">
      <head>
        <title>Kitchen sink</title>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <meta charSet="utf-8" />
      </head>
      <body className="subpixel-antialiased">
        <ProgressBar className="fixed top-0 h-1 bg-sky-500 shadow-lg shadow-sky-500/20" />
        <div>
          <Nav />
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

        <Toaster />
      </body>

      <TwofoldFramework />
    </html>
  );
}
