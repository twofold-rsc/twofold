export default function SlugPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <span className="bg-gray-100 text-black font-semibold font-mono px-1.5 py-1 rounded">
        &#123;params.slug&#125;
      </span>{" "}
      is: {params.slug}
    </div>
  );
}
