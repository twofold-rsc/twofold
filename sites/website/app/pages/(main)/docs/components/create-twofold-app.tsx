"use client";

import { ReactNode, use } from "react";
import { Context } from "./cli/provider";

export function CreateTwofoldApp() {
  let { command } = use(Context);

  return (
    <div className="not-prose relative my-6 overflow-x-scroll rounded-md bg-[#24292e] text-sm shadow-md ring shadow-black/20 ring-slate-950/10">
      <div className="inline-block w-max min-w-full p-4">
        <pre
          className="text-[13px] leading-[1.7] text-[#e1e4e8] subpixel-antialiased"
          tabIndex={0}
        >
          <code>
            {command === "pnpm" ? (
              <Line>pnpm create twofold-app@latest</Line>
            ) : (
              <Line>npx create-twofold-app@latest</Line>
            )}

            <Line />

            <Output type="info">Welcome to the Twofold app generator!</Output>

            <Line />

            <Output type="question">
              What is the name of your app?{"  "}
              <span className="font-bold">my-app</span>
            </Output>

            <Line />

            <Output type="pending">Setting up a new Twofold app...</Output>
            <Output type="complete">App created!</Output>
            <Output type="pending">
              Installing dependencies. This may take a minute...
            </Output>
            <Output type="complete">Dependencies installed!</Output>
            <Output type="pending">Initializing git repository...</Output>
            <Output type="complete">Git repository created!</Output>

            <Line />

            <Output type="success">All set!</Output>

            <Line />

            <Output type="info">App installed at: ./my-app/</Output>
            <Output type="info">Run app: cd my-app && pnpm dev</Output>
          </code>
        </pre>
      </div>
    </div>
  );
}

function Line({ children }: { children?: ReactNode }) {
  return (
    <span className="line">
      <span>
        {children}
        {"\n"}
      </span>
    </span>
  );
}

let colors = {
  info: "text-[#8159f7]",
  pending: "text-[#DB27DA]",
  complete: "text-[#38B9C7]",
  success: "text-[#38C027]",
  question: "text-[#38C027]",
};

function Output({
  type,
  children,
}: {
  type: "info" | "pending" | "complete" | "success" | "question";
  children: ReactNode;
}) {
  return (
    <Line>
      <span className={colors[type]}>
        {type === "info"
          ? "ℹ"
          : type === "success" || type === "question"
            ? "✔"
            : type === "pending"
              ? "☐"
              : "☒"}
        {"  "}
      </span>
      {type !== "question" && (
        <>
          <span className={`${colors[type]} underline`}>{type}</span>
          {" ".repeat(10 - type.length)}
        </>
      )}
      <span>{children}</span>
    </Line>
  );
}
