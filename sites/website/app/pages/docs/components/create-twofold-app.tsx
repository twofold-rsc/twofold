import { ReactNode } from "react";

export function CreateTwofoldApp() {
  return (
    <div className="not-prose relative my-6 rounded-md bg-[#24292e] p-4 text-sm">
      <pre className="text-sm leading-[1.7] text-[#e1e4e8]" tabIndex={0}>
        <code>
          <Line>pnpm create twofold-app@latest</Line>

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

      <div className="pointer-events-none absolute inset-0 rounded-md ring ring-white/20 ring-inset" />
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
