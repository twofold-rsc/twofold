import { ReactNode } from "react";
import { FlashProvider } from "./flash-provider";
import cookies from "../http/cookies";

export default function OuterRootWrapper({
  children,
}: {
  children: ReactNode;
}) {
  let flashCookies = cookies
    .all()
    .filter((cookie) => cookie.name.startsWith("_tf_flash_"));

  return <FlashProvider flashCookies={flashCookies}>{children}</FlashProvider>;
}
