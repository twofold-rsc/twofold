import Link from "@twofold/framework/link";

export default function EndPage() {
  return (
    <p>
      Redirect complete.{" "}
      <Link
        href="/server-actions/flash-messages"
        className="text-blue-500 underline"
      >
        Go back
      </Link>{" "}
      to the flash messages page.
    </p>
  );
}
