"use server";

export async function action() {
  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(`${i + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      controller.close();
    },
  });
}
