export default function NotFoundPage({ request }: { request: Request }) {
  let url = new URL(request.url);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "0 24px",
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
            {url.pathname}
            {url.search}
          </code>{" "}
          was not found.
        </p>
      </div>
    </div>
  );
}
