"use client";

import { useRouter } from "../../hooks/use-router";

export default function UnauthorizedError() {
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
          Not authorized
        </h1>
        <p style={{ marginTop: "12px" }}>
          You are not authorized to view the path{" "}
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
          </code>
          .
        </p>
      </div>
    </div>
  );
}
