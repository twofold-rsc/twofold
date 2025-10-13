import { ReactNode } from "react";
import { Fence } from "./fence";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import invariant from "tiny-invariant";

export function CodeTabs({
  files,
  children,
}: {
  files: string[];
  children: ReactNode;
}) {
  invariant(files[0], "files must have at least one file");

  return (
    <div className="not-prose my-6">
      <Tabs.Root defaultValue={files[0]}>
        <Tabs.List className="-mx-2 flex overflow-x-scroll sm:mx-0">
          {files.map((file) => (
            <Tabs.Trigger
              key={file}
              value={file}
              className={clsx(
                "shrink-0 rounded-t-md pt-[8px] pb-[6px] font-mono text-xs",
                "px-3 sm:px-4",
                "data-[state=active]:bg-[#24292e] data-[state=active]:text-slate-50",
                "data-[state=inactive]:opacity-90",
              )}
            >
              <FilenameTab file={file} />
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div>{children}</div>
      </Tabs.Root>
    </div>
  );
}

function FilenameTab({ file }: { file: string }) {
  let [name, ext] = file.split(".");

  return (
    <span>
      {name}
      <span className="hidden sm:inline">.{ext}</span>
    </span>
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
