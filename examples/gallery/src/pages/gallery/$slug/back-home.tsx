import Link from "@twofold/framework/link";
import { useViewTransition } from "../../providers/animation";

export function BackHome() {
  let { navigate } = useViewTransition();

  return (
    <Link
      onClick={(e) => {
        e.preventDefault();
        navigate("/");
      }}
      href="/"
    >
      Back home
    </Link>
  );
}
