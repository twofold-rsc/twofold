// import { db } from "./database";

// async function sendMessage(form: FormData) {
//   "use server";

//   await db.insert("messages", {
//     message: form.get("message"),
//   });
// }

// export async function ServerActionChat() {
//   let messages = await db.query("messages");

//   return (
//     <div className="border border-blue-300 rounded shadow flex flex-col min-h-[400px]">
//       <div className="grow">
//         {messages.map((message) => (
//           <div
//             key={message.id}
//             className={`px-3 py-3 border-b border-gray-200`}
//           >
//             {message.message}
//           </div>
//         ))}
//       </div>
//       <div className="p-3">
//         <form action={sendMessage} className="flex" key={messages.at(-1)?.id}>
//           <input
//             type="text"
//             name="message"
//             placeholder="Send a message"
//             className="border border-gray-200 rounded px-2 py-1 w-full text-sm focus:outline-none focus:border-blue-300"
//           />
//           <input
//             type="submit"
//             value="Send"
//             className="bg-blue-600 hover:bg-blue-700 text-sm text-white px-4 py-1 rounded ml-2"
//           />
//         </form>
//       </div>
//     </div>
//   );
// }
