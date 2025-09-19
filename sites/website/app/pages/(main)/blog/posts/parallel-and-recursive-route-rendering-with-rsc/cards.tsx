import clsx from "clsx";

export function WaterfallTimeline() {
  return (
    <div className="not-prose my-6">
      <div className="grid grid-cols-3 grid-rows-3">
        <div className="col-start-1 row-start-1">
          <Card className="mt-0.5 border-amber-500 bg-amber-50 text-amber-600">
            &lt;RootLayout&gt;
          </Card>
        </div>
        <div className="col-start-2 row-start-2">
          <Card className="mt-0.5 border-violet-500 bg-violet-50 text-violet-600">
            &lt;PostsLayout&gt;
          </Card>
        </div>
        <div className="col-start-3 row-start-3">
          <Card className="mt-0.5 border-blue-500 bg-blue-50 text-blue-600">
            &lt;EditPage&gt;
          </Card>
        </div>
      </div>
      <div className="mt-4 text-gray-500">
        <svg viewBox="0 0 840 40" xmlns="http://www.w3.org/2000/svg">
          <line
            x1="0"
            y1="30"
            x2="840"
            y2="30"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <line
            x1="1"
            y1="20"
            x2="1"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="15"
            fontSize="14"
            textAnchor="left"
            fill="currentColor"
          >
            0s
          </text>

          <line
            x1="140"
            y1="20"
            x2="140"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="140"
            y="15"
            fontSize="14"
            textAnchor="middle"
            fill="currentColor"
          >
            0.5s
          </text>

          <line
            x1="280"
            y1="20"
            x2="280"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="280"
            y="15"
            fontSize="14"
            textAnchor="middle"
            fill="currentColor"
          >
            1s
          </text>

          <line
            x1="420"
            y1="20"
            x2="420"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="420"
            y="15"
            fontSize="14"
            textAnchor="middle"
            fill="currentColor"
          >
            1.5s
          </text>

          <line
            x1="560"
            y1="20"
            x2="560"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="560"
            y="15"
            fontSize="14"
            textAnchor="middle"
            fill="currentColor"
          >
            2s
          </text>

          <line
            x1="700"
            y1="20"
            x2="700"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="700"
            y="15"
            fontSize="14"
            textAnchor="middle"
            fill="currentColor"
          >
            2.5s
          </text>

          <line
            x1="839"
            y1="20"
            x2="839"
            y2="40"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <text
            x="825"
            y="15"
            fontSize="14"
            textAnchor="right"
            fill="currentColor"
          >
            3s
          </text>
        </svg>
      </div>
      <div className="mt-3 text-center text-xs text-gray-500 italic">
        Component rendering timeline
      </div>
    </div>
  );
}

export function CardStack() {
  return (
    <div className="not-prose my-6 flex items-center justify-center">
      <div className="flex min-w-[300px] flex-col items-center justify-center space-y-3">
        <Card className="border-amber-500 bg-amber-50 text-amber-600">
          <pre>&lt;PostsLayout&gt;</pre>
          <pre>{"  "}&lt;Placeholder&gt;</pre>
          <pre>&lt;/PostsLayout&gt;</pre>
        </Card>
        <Card className="border-violet-500 bg-violet-50 text-violet-600">
          <pre>&lt;PostsLayout&gt;</pre>
          <pre>{"  "}&lt;Placeholder&gt;</pre>
          <pre>&lt;/PostsLayout&gt;</pre>
        </Card>
        <Card className="border-blue-500 bg-blue-50 text-blue-600">
          &lt;EditPage postId=&#123;123&#125;&gt;
        </Card>
      </div>
    </div>
  );
}

function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "w-full rounded-md border-2 p-4 font-mono text-xs font-semibold sm:text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
