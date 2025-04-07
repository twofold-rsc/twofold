import { LayoutProps } from "@twofold/framework/types";

export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Gallery</h1>
      <div className="mt-8">{children}</div>
    </div>
  );
}
