"use client";

import { useRouter } from "../../hooks/use-router";

export default function NotFoundError() {
  let router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 900,
            letterSpacing: "-0.025em",
          }}
        >
          Not found
        </h1>
        <p style={{ marginTop: "12px" }}>
          The path{" "}
          <code
            style={{
              fontSize: "0.85rem",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              padding: "3px 4px",
              borderRadius: "4px",
            }}
          >
            {router.path}
            {router.searchParams.size > 0
              ? `?${router.searchParams.toString()}`
              : ""}
          </code>{" "}
          was not found.
        </p>
      </div>
    </div>
  );
}
