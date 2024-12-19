import Todos from "./todos";

let todos = [
  { id: 1, text: "Buy milk" },
  { id: 2, text: "Do laundry" },
];

export type Todo = (typeof todos)[number];

async function addTodo(form: FormData) {
  "use server";

  await new Promise((resolve) => setTimeout(resolve, 2500));

  let text = form.get("text");
  if (typeof text === "string" && Math.random() > 0.5) {
    todos.push({ id: todos.length + 1, text });
  } else {
    console.log("SKIPPING TODO:", text);
  }
}

export default function FormStatePage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">useOptimistic</h1>
      <div className="mt-3">
        <Todos todos={todos} addAction={addTodo} />
      </div>
    </div>
  );
}
