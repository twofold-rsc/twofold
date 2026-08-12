export default function Page() {
  // build-error-on
  // return <div>I dont close my tags
  // build-error-off
  return (
    <ul>
      <li>1</li>
      <li>2</li>
    </ul>
  );
}
