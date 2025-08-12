import Markdoc, { RenderableTreeNodes } from "@markdoc/markdoc";
import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import React, { ComponentType } from "react";
import { Fence } from "./components/fence";
import { Footnote } from "./components/footnote";
import { loadComponents, loadContent, loadMetadata } from "./data-layer/posts";
import { getTitle } from "../../../markdoc/utils";
import { CLICommand } from "../../../components/cli/command";
import { StandoutComment } from "./components/standout-comment";
// import { Callout } from "./components/callout";
// import { Image } from "./components/image";

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
            <MarkdocContent content={content} components={components} />
            {meta.publishedAt && (
              <div className="mt-12 font-serif text-sm text-gray-500">
                Last updated:{" "}
                {new Date(meta.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
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

async function MarkdocContent({
  content,
  components,
}: {
  content: RenderableTreeNodes;
  components: Record<string, ComponentType>;
}) {
  let allComponents = {
    ...components,
    Fence,
    Footnote,
    CLICommand,
    StandoutComment,
    // Callout,
    // Image,
  };

  return (
    <>
      {Markdoc.renderers.react(content, React, {
        components: allComponents,
      })}
    </>
  );
}
