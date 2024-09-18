export function GET() {
  let stream = new ReadableStream({
    async start(controller) {
      controller.enqueue("First. ");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      controller.enqueue("Second. ");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      controller.enqueue("Third. ");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      controller.enqueue("Finished.");
      controller.close();
    },
  });

  return new Response(stream);
}
