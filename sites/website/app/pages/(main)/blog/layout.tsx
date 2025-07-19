import { ReactNode } from "react";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* <link
        href="https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap"
        rel="stylesheet"
        precedence="default"
      /> */}
      <link
        rel="alternate"
        type="application/rss+xml"
        title="RSS"
        href="/blog/rss"
      />

      <div className="mx-auto mt-8 max-w-prose px-6 pb-24 md:px-0">
        {children}
      </div>
    </>
  );
}
