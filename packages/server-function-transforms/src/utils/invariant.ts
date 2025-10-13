export function invariant(
  condition: any,
  message: string = "Invariant violation",
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
