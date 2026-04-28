import { unauthorized } from "../../http/unauthorized";

export default function ThrowUnauthorizedPage() {
  unauthorized();
}
