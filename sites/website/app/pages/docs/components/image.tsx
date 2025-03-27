export function Image({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="not-prose flex items-center justify-center">
      <img src={src} alt={alt} className="max-w-full" />
    </div>
  );
}
