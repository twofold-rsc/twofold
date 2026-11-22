// @ts-expect-error The test stages this package in the temporary app's node_modules.
import { variant } from "entry-variants";

export default function Page() {
  return variant;
}
