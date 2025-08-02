import { LayoutProps } from "@twofold/framework/types";

export default async function Layout({ children }: LayoutProps) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <div className="border border-blue-500 p-4">
      <div>Inner layout</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
