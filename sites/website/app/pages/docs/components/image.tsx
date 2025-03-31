export function Image({
  src,
  alt,
  border = false,
}: {
  src: string;
  alt: string;
  border?: boolean;
}) {
  return (
    <div className="not-prose relative flex items-center justify-center">
      <img src={src} alt={alt} className="max-w-full rounded" />
      {border && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded ring ring-black/5 ring-inset" />
      )}
    </div>
  );
}
