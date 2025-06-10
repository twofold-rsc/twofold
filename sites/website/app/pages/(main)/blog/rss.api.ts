import { APIProps } from "@twofold/framework/types";
import { getPosts } from "./data-layer/posts";

export async function GET({ request }: APIProps) {
  let baseUrl = new URL(request.url);
  let rssXml = await generateRSS({ baseUrl });

  return new Response(rssXml, {
    headers: { "Content-Type": "application/rss+xml" },
  });
}

async function generateRSS({ baseUrl }: { baseUrl: URL }) {
  let items = await getItems();

  let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Twofold Blog</title>
    <link>${new URL("/blog", baseUrl).href}</link>
    <description>Writings about React Server Components</description>
    <atom:link href="${new URL("/blog/rss", baseUrl).href}" rel="self" type="application/rss+xml" />
    ${items
      .map(
        (item) => `<item>
      <title><![CDATA[${item.title}]]></title>
      <link>${new URL(`/blog/${item.slug}`, baseUrl).href}</link>
      <pubDate>${item.date ? item.date.toUTCString() : ""}</pubDate>
      <guid>${new URL(`/blog/${item.slug}`, baseUrl).href}</guid>
      <description><![CDATA[${item.description}]]></description>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return rssFeed.trim();
}

let localCache:
  | { title: string; slug: string; date: Date | null; description: string }[]
  | null = null;

async function getItems() {
  if (!localCache) {
    localCache = await getPosts();
  }

  return localCache;
}
