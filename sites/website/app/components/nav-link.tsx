"use client";

import Link from "@twofold/framework/link";
import { useOptimisticRoute } from "@twofold/framework/use-optimistic-route";
import { ComponentProps } from "react";

type Props = ComponentProps<typeof Link<"a">> & {
  match?: "exact" | "beginning";
  idleClassName?: string;
  navigatingClassName?: string;
};

export function NavLink(props: Props) {
  let optimisticRoute = useOptimisticRoute();
  let { match, navigatingClassName, idleClassName, ...rest } = props;

  let isMatch =
    match === "beginning"
      ? optimisticRoute.path.startsWith(props.href)
      : optimisticRoute.path === props.href;

  let classNames = [
    isMatch ? navigatingClassName : idleClassName,
    props.className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Link {...rest} className={classNames} />;
}
