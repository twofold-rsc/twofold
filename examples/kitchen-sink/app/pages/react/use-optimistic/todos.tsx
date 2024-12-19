"use client";

import { useOptimistic, useRef } from "react";
import { Todo } from "./index.page";

type OptimisticTodo = Todo & { tempId?: string };

export default function Form({
  todos,
  addAction,
}: {
  todos: Todo[];
  addAction: (form: FormData) => Promise<void>;
}) {
  let [optimisticTodos, setOptimisticTodos] =
    useOptimistic<OptimisticTodo[]>(todos);

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

    ref.current?.reset();

    await addAction(formData);
  }

  let ref = useRef<HTMLFormElement>(null);

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

      <form action={formAction} ref={ref}>
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
