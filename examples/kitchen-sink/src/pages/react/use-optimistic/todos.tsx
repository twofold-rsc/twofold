"use client";

import { useOptimistic } from "react";

export default function Form({
  todos,
  addAction,
}: {
  todos: { id: number; text: string }[];
  addAction: (form: FormData) => Promise<void>;
}) {
  let [optimisticTodos, setOptimisticTodos] =
    useOptimistic<((typeof todos)[number] & { tempId?: string })[]>(todos);

  async function formAction(formData: FormData) {
    let text = formData.get("text");

    setOptimisticTodos((currentTodos) => {
      if (typeof text !== "string") {
        throw new Error("Invalid todo");
      }

      return [
        ...currentTodos,
        {
          id: 0,
          tempId: crypto.randomUUID(),
          text,
        },
      ];
    });

    await addAction(formData);
  }

  return (
    <div>
      <ul className="list-disc pl-4">
        {optimisticTodos.map((optimisticTodo) => (
          <li
            key={
              optimisticTodo.id > 0 ? optimisticTodo.id : optimisticTodo.tempId
            }
          >
            {optimisticTodo.text}{" "}
            {optimisticTodo.id === 0 ? (
              <span className="text-sm italic text-gray-500">(pending)</span>
            ) : null}
          </li>
        ))}
      </ul>

      <form action={formAction}>
        <div className="mt-3 flex items-center space-x-2">
          <input
            type="text"
            name="text"
            autoComplete="off"
            placeholder="Enter a task"
            className="rounded border border-gray-300 px-2 py-1.5 shadow"
          />
          <button
            type="submit"
            className="rounded bg-black px-4 py-1.5 font-medium text-white"
          >
            Add todo
          </button>
        </div>
      </form>
    </div>
  );
}
