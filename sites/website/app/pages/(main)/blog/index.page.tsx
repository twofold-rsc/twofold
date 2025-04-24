import Link from "@twofold/framework/link";

export default function BlogPage() {
  return (
    <div>
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tighter">
          Twofold Blog
        </h1>
        <p className="mt-1 font-serif text-gray-700">
          Writings about React Server Components.
        </p>
      </div>
      <div className="mt-16">
        <Link
          href="/blog/you-can-serialize-a-promise-in-react"
          className="font-sans text-2xl font-bold tracking-tight text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          You can serialize a promise in React
        </Link>
        <p className="mt-1 font-serif text-gray-700">
          Use React to create a promise on the server and later finish it on the
          client.
        </p>
      </div>
    </div>
  );
}
