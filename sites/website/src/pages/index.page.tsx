import { Home } from "./get-started-link";

export default async function Page() {
  return <Home />;
}

function GridLines({
  rows,
  cols,
  color,
}: {
  rows: number;
  cols: number;
  color: "blue" | "gray";
}) {
  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  let colors = {
    blue: "bg-blue-100",
    gray: "bg-gray-100",
  };

  return (
    <div
      className={`z-0 absolute inset-0 grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px ${colors[color]} p-px`}
    >
      {grid.map((row, i) =>
        row.map((_, j) => <div key={`${i}_${j}`} className="bg-white"></div>),
      )}
    </div>
  );
}
