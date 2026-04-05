export * from "../../backend/auth/auth";

export function isServerActionUnauthorizedError(err: any) {
  return (
    err instanceof Error &&
    "message" in err &&
    typeof err.message === "string" &&
    err.message.startsWith("TwofoldUnauthorizedError")
  );
}
