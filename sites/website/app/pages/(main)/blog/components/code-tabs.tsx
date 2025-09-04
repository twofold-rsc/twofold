import { ReactNode } from "react";
import { Fence } from "./fence";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";

export function CodeTabs({
  files,
  children,
}: {
  files: string[];
  children: ReactNode;
}) {
  return (
    <div className="not-prose my-6">
      <Tabs.Root defaultValue={files[0]}>
        <Tabs.List>
          {files.map((file) => (
            <Tabs.Trigger
              key={file}
              value={file}
              className={clsx(
                "rounded-t-md px-3 pt-[8px] pb-[7px] font-mono text-xs",
                "data-[state=active]:bg-[#24292e] data-[state=active]:text-slate-50",
                "data-[state=inactive]:opacity-90",
              )}
            >
              {file}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div>{children}</div>
      </Tabs.Root>
    </div>
  );
}

export function CodeTabsFence(
  props: Parameters<typeof Fence>[0] & {
    file: string;
    isFirst: boolean;
  },
) {
  let { file, isFirst, ...rest } = props;

  return (
    <Tabs.Content value={file}>
      <Fence {...rest} tabs={{ isFirst }} />
    </Tabs.Content>
  );
}
