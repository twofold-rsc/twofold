import { state } from "./actions";
import { IncrementCountButton } from "./increment-count-button";
import { Random } from "./random";
import { RefreshPage } from "./refresh-page";

export function SelectedNumber({ number }: { number: number }) {
  let now = new Date();

  return (
    <div>
      <p>Selected number: {number}</p>
      <p>Current time: {now.toLocaleTimeString()}</p>
      <div className="mt-4">
        <RefreshPage />
      </div>
      <div className="mt-4 w-full border border-gray-200 p-4">
        <h4 className="text-lg font-bold">Actions</h4>
        <div className="mt-3">
          <IncrementCountButton count={state.count} />
        </div>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <Random />
        </div>
      </div>
    </div>
  );
}
