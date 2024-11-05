import type { ReactNode } from "react";
import { z } from "zod";
import { configSchema } from "../backend/build/build/build";

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

export type APIProps<T extends string | never = never> = {
  params: Record<T, string>;
  searchParams: URLSearchParams;
  request: Request;
};

export type Config = z.infer<typeof configSchema>;
