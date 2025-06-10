import Link from "@twofold/framework/link";
import { getPosts } from "./data-layer/posts";

export default async function BlogPage() {
  const posts = await getPosts();
  const sortedPosts = [...posts].sort((a, b) => {
    const aDate = a.date ? a.date.getTime() : 0;
    const bDate = b.date ? b.date.getTime() : 0;
    return bDate - aDate;
  });

  return (
    <>
      <title>Twofold Blog</title>
      <meta
        name="description"
        content="Writings about React Server Components."
      />

      <div>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tighter">
            Twofold Blog
          </h1>
          <p className="mt-1 font-serif text-gray-700">
            Writings about React Server Components.
          </p>
        </div>
        {sortedPosts.map((post) => (
          <div key={post.slug} className="mt-16">
            <Link
              href={`/blog/${post.slug}`}
              className="font-sans text-2xl font-bold tracking-tight text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              {post.title}
            </Link>
            <p className="mt-1 font-serif text-gray-700">{post.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
