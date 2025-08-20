import { readFile } from "fs/promises";
import { marked } from "marked";
import path from "path";
import { Suspense } from "react";

export default async function MarkdownReader() {
  return (
    <div>
      <div className="-mb-0.5 inline-flex rounded-t bg-green-500 px-2 py-1 text-white">
        Markdown
      </div>
      <div className="rounded border-2 border-dashed border-green-500 p-4">
        <Suspense fallback={<div>Loading...</div>}>
          <MarkdownContent />
        </Suspense>
      </div>
    </div>
  );
}

async function MarkdownContent() {
  let file = path.join(
    process.cwd(),
    `./app/pages/build/dev-reload/markdown.md`,
  );
  let contents = await readFile(file, "utf-8");
  let html = marked(contents);

  return (
    <div>
      <p className="text-gray-900">
        This page is a server component that renders the contents of a markdown
        file.
      </p>
      <div
        className="mt-4 border-l-2 border-green-300 py-2 pl-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:tracking-tight [&>p]:mt-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
