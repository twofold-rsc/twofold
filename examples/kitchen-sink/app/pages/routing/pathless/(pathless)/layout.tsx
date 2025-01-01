import { LayoutProps } from "@twofold/framework/types";

export default function PathlessLayout({ children }: LayoutProps) {
  return (
    <div className="rounded border border-gray-300 bg-gray-100 p-6 shadow">
      {children}
    </div>
  );
}
