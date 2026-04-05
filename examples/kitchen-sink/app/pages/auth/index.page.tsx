import cookies from "@twofold/framework/cookies";
import Control from "./Control";

export default function Page() {
  const allowIfCookieSetWillPass = cookies.get("allow-access") === "true";

  return <Control allowIfCookieSetWillPass={allowIfCookieSetWillPass} />;
}
