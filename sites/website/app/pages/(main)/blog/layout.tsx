import { ReactNode } from "react";
import MerriweatherFont from "@/public/fonts/merriweather-latin-regular.woff2";
import Merriweather700Font from "@/public/fonts/merriweather-latin-700.woff2";
import MerriweatherItalicFont from "@/public/fonts/merriweather-latin-italic.woff2";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="preload"
        href={MerriweatherFont}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href={MerriweatherItalicFont}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href={Merriweather700Font}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="alternate"
        type="application/rss+xml"
        title="RSS"
        href="/blog/rss"
      />

      <div className="mx-auto mt-8 max-w-prose px-4 pb-24 md:px-0">
        {children}
      </div>
    </>
  );
}
