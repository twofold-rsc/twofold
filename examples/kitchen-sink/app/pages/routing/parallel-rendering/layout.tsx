import { LayoutProps } from "@twofold/framework/types";

export default async function Layout({ children }: LayoutProps) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <div>
      <div>
        <h1 className="text-4xl font-black tracking-tighter">
          Parallel rendering
        </h1>
        <p className="mt-3">
          This page renders multiple nested layouts in parallel without
          waterfalling.
        </p>
      </div>

      <div className="mt-4 border border-red-500 p-4">
        <div>Outermost layout</div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
