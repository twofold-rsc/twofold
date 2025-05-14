export function CLICommand({
  tools,
}: {
  tools: { command: string; name: string }[];
}) {
  return (
    <div>
      {tools.map((tool) => (
        <div key={tool.name}>
          {tool.name}: {tool.command}
        </div>
      ))}
    </div>
  );
}
