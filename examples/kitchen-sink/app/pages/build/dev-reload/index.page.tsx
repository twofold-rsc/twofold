import ClientComponent from "./client-component";
import MarkdownReader from "./markdown-reader";
import ServerComponent from "./server-component";

export default function DevReloadPage() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Dev reload</h1>

      <div className="mt-8">
        <ServerComponent />
      </div>

      <div className="mt-12">
        <ClientComponent />
      </div>

      <div className="mt-12">
        <MarkdownReader />
      </div>
    </div>
  );
}
