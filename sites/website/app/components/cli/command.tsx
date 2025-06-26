"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Context } from "./provider";
import { use } from "react";
import clsx from "clsx";
import { NpmIcon } from "../../icons/npm";
import { PnpmIcon } from "../../icons/pnpm";

export function CLICommand({
  tools,
  selectable,
  shadow = true,
}: {
  tools: { command: string; name: string }[];
  selectable?: boolean;
  shadow?: boolean;
}) {
  let { command, setCommand } = use(Context);

  return (
    <div className="not-prose my-6">
      <Tabs.Root value={command} onValueChange={setCommand} className="w-full">
        {selectable && (
          <Tabs.List className="pb-[2px]">
            {tools.map((tool) => (
              <Tabs.Trigger
                value={tool.name}
                key={tool.name}
                className={clsx(
                  "group relative inline-flex items-center justify-center space-x-1.5 rounded-t-md px-4 pt-[8px] pb-[6px] font-mono text-sm data-[state=active]:bg-[#24292e] data-[state=active]:text-slate-50 data-[state=inactive]:opacity-90",
                  shadow &&
                    "data-[state=active]:ring data-[state=active]:ring-slate-950/10",
                )}
              >
                {tool.name === "npm" ? (
                  <NpmIcon className="size-3.5" />
                ) : tool.name === "pnpm" ? (
                  <PnpmIcon className="size-3.5" />
                ) : null}

                <span>{tool.name}</span>

                <div className="pointer-events-none absolute inset-x-0 bottom-[-2px] hidden h-[2px] bg-[#24292e] group-data-[state=active]:block" />
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        )}
        <div>
          {tools.map((tool) => (
            <Tabs.Content
              value={tool.name}
              key={tool.name}
              className={clsx(
                "overflow-x-scroll rounded-tr-md rounded-b-md bg-[#24292e] text-sm",
                shadow && "shadow-md ring shadow-black/20 ring-slate-950/10",
                selectable ? "not-first:rounded-tl-md" : "rounded-tl-md",
                "text-[13px] leading-[1.7] subpixel-antialiased",
              )}
            >
              <div className="w-max min-w-full p-4 font-mono text-[#e1e4e8]">
                {tool.command}
              </div>
            </Tabs.Content>
          ))}
        </div>
      </Tabs.Root>
    </div>
  );
}
