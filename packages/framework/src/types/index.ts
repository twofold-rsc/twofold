import type { ReactNode } from "react";

export type PageProps<T extends string | never = never> = {
  params: Record<T, string>;
  searchParams: URLSearchParams;
  request: Request;
};

export type LayoutProps = {
  params: Record<string, string | undefined>;
  searchParams: URLSearchParams;
  request: Request;
  children: ReactNode;
};
