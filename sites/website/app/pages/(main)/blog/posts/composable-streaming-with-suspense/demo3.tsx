import { Fence } from "../../components/fence";
import { ToggleContent, ToggleRoot, ToggleSwitch } from "./demo3-toggle";

const streamingCode = `import { Suspense } from "react"; // [!code highlight]

function Page() {
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      // [!code highlight]
      <Suspense fallback={<span>Loading comments...</span>}> 
        <Comments />
      // [!code highlight]
      </Suspense>
    </div>
  );
}`;

const nonStreamingCode = `import { Suspense } from "react";

function Page() { // [!code focus]
  return ( // [!code focus]
    // [!code focus]
    <div>
      // [!code focus]
      <h1>{post.title}</h1>
      // [!code focus]
      <p>{post.content}</p>

      <Suspense fallback={<span>Loading comments...</span>}> 
        // [!code focus]
        <Comments />
      </Suspense>
      // [!code focus]
    </div>
  ); // [!code focus]
} // [!code focus]`;

export function Demo3() {
  return (
    <div className="not-prose">
      <ToggleRoot>
        <ToggleContent id="streaming" key="streaming">
          <Fence language="jsx">{streamingCode}</Fence>
        </ToggleContent>

        <ToggleContent id="not-streaming" key="not-streaming">
          <Fence language="jsx">{nonStreamingCode}</Fence>
        </ToggleContent>

        <ToggleSwitch />
      </ToggleRoot>
    </div>
  );
}
