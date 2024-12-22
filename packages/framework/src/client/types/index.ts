import type { ReactNode } from "react";
import { z } from "zod";

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

export const configSchema = z.object({
  externalPackages: z.array(z.string()).optional(),
  bundlePackages: z.array(z.string()).optional(),
  reactCompiler: z.boolean().optional(),
  trustProxy: z.boolean().optional(),
});

export type Config = z.infer<typeof configSchema>;
