import Markdoc, { RenderableTreeNodes } from "@markdoc/markdoc";
import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import React, { ComponentType } from "react";
import { loadComponents, loadContent, loadMetadata } from "./data-layer/posts";
import { getTitle } from "../../../markdoc/utils";
import ryanPicture from "./images/ryan.avif";
import { XTwitterIcon } from "@/app/icons/x-twitter";
import { BlueskyIcon } from "@/app/icons/bluesky";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import Merriweather700Font from "@/public/fonts/merriweather-latin-700.woff2";
import MerriweatherItalicFont from "@/public/fonts/merriweather-latin-italic.woff2";

export default async function PostPage({ params, request }: PageProps<"slug">) {
  let slug = params.slug;

  let content = await loadContent(slug);
  let title = getTitle(content);
  // let headings = getHeadings(content);
  let meta = await loadMetadata(slug);
  let components = await loadComponents(slug);

  let url = new URL(request.url);
  let ogImageUrl = new URL(`/images/blog/${slug}/og-image.png?v2`, url.origin);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={meta.description} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={ogImageUrl.href} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url.href} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImageUrl.href} />

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
        rel="canonical"
        href={`https://twofoldframework.com/blog/${slug}`}
      />

      <div className="min-w-0">
        <div>
          <div className="flex items-center space-x-2 font-medium">
            <Link
              href={`/blog`}
              className="text-sm text-gray-500 hover:underline active:text-gray-600"
            >
              Blog
            </Link>
            <span className="text-xs text-gray-400">/</span>
            <Link
              href={`/blog/${slug}`}
              className="text-sm text-blue-500 hover:underline active:text-blue-600"
            >
              {title}
            </Link>
          </div>
          <div className="prose prose-h1:mb-4 prose-li:font-serif prose-p:font-serif first-of-type:prose-p:mt-0 mt-8">
            {Markdoc.renderers.react(content, React, {
              components,
            })}
          </div>

          <div className="mt-12 flex items-center justify-between">
            <div className="flex items-center space-x-2 font-serif">
              <div className="relative">
                <img
                  src={ryanPicture}
                  alt="Ryan"
                  className="size-12 rounded-full"
                />
                <div className="pointer-events-none absolute inset-0 rounded-full ring ring-black/5 ring-inset" />
              </div>
              <div>
                <div className="font-bold">Ryan Toronto</div>
                {meta.publishedAt && (
                  <div className="text-sm text-gray-500">
                    {" "}
                    {new Date(meta.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="mailto:ryanto@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Email"
              >
                <EnvelopeIcon className="size-[22px] stroke-[1.4]" />
              </a>
              <a
                href="https://x.com/ryantotweets"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on X (Twitter)"
              >
                <XTwitterIcon className="size-[18px]" />
              </a>
              <a
                href="https://bsky.app/profile/ryantoron.to"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Bluesky"
              >
                <BlueskyIcon className="size-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="hidden lg:block">
        <div className="sticky top-8">
          <div className="text-sm font-semibold text-gray-500">
            On this page
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {headings
              .filter((heading) => heading.level <= 2)
              .map((heading) => (
                <li key={heading.title}>
                  <Link
                    href={`/docs/${slug}${heading.level > 1 ? `#${heading.id}` : ""}`}
                  >
                    {heading.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div> */}
    </>
  );
}
