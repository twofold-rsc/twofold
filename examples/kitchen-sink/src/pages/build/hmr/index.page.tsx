import HMRA from "./hmr-a";
import HMRB from "./hmr-b";

export default function HMRPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">HMR</h1>
      <div className="mt-4 flex space-x-8">
        <HMRA />
        <HMRB />
      </div>
    </div>
  );
}
