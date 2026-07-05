import { APIProps } from "@twofold/framework/types";
import dedent from "dedent";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { getPosts } from "./(main)/blog/data-layer/posts";

export async function GET({ request }: APIProps) {
  let baseUrl = new URL(request.url);
  let sitemapXml = await getSitemap({ baseUrl });

  return new Response(sitemapXml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

let localCache: string | null = null;

async function getSitemap({ baseUrl }: { baseUrl: URL }) {
  if (!localCache) {
    localCache = await generateSitemap({ baseUrl });
  }

  return localCache;
}

async function generateSitemap({ baseUrl }: { baseUrl: URL }) {
  let [docSlugs, posts] = await Promise.all([getDocSlugs(), getPosts()]);

  let urls = [
    "/",
    "/blog",
    ...posts
      .filter((post) => post.published)
      .map((post) => `/blog/${post.slug}`),
    ...docSlugs.map((slug) => `/docs/${slug}`),
  ];

  let sitemapEntries = urls
    .map(
      (url) =>
        `  <url><loc>${escapeXml(new URL(url, baseUrl).href)}</loc></url>`,
    )
    .join("\n");

  let xml = dedent`
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemapEntries}
    </urlset>
  `;

  return xml;
}

async function getDocSlugs() {
  let directoryPath = path.join(process.cwd(), "./app/pages/(main)/docs/");
  let files = await readdir(directoryPath, {
    recursive: true,
    withFileTypes: true,
  });

  return files
    .filter((file) => file.isFile())
    .filter((file) => file.name.endsWith(".md"))
    .map((file) =>
      path
        .relative(directoryPath, path.join(file.parentPath, file.name))
        .replace(/\.md$/, ""),
    )
    .sort();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
