import { DisplayText } from "./client-component";

export default function LoggingPage() {
  console.log("Hello world!");
  console.log("Hello <b>html</b> world!");
  console.log("Hello <script></script> world!");

  return (
    <div className="space-y-4">
      <div>
        <h2>These should be escaped</h2>
        <p>{"A string with some HTML: <b>Hello</b><script></script>"}</p>
        <DisplayText text="Hello <b>world!</b><script></script>" />
      </div>
      <div>
        <h2>This should contain HTML</h2>
        <p
          dangerouslySetInnerHTML={{
            __html: "A string with some <b>HTML</b><script></script>",
          }}
        ></p>
      </div>
    </div>
  );
}
