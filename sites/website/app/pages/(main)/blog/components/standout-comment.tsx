export function StandoutComment({ children }: { children: string }) {
  return (
    <span className="not-prose mx-0.5 rounded bg-blue-100 px-1.5 py-1 font-mono text-sm font-semibold text-blue-800">
      {children}
    </span>
  );
}
