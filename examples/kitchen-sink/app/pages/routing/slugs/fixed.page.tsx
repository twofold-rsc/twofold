export default function Page() {
  return (
    <div>
      This is a fixed page that is a sibling of a dynamic page. It should have
      rendering precedence over the dynamic page.
    </div>
  );
}
