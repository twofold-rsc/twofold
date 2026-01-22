import { unauthorized } from "@twofold/framework/unauthorized";

export function GET() {
  unauthorized();
}
