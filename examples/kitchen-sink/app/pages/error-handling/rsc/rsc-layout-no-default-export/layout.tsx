import { ReactNode } from "react";

// build-error-on
// export { Layout };
// build-error-off
export default Layout;

function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
