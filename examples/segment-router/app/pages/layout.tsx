import TwofoldFramework from "@twofold/framework/twofold-framework";
import { LayoutProps } from "@twofold/framework/types";
import "./global.css";

export default function Layout({ children }: LayoutProps) {
  return (
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>

      {/* This component is needed to start Twofold */}
      <TwofoldFramework />
    </html>
  );
}
