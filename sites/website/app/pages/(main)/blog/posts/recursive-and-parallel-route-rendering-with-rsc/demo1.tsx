import { ReactNode } from "react";
import { Browser } from "../../components/browser";
import AlicePhoto from "./alice.avif";
import cookies from "@twofold/framework/cookies";
import z from "zod";
import { SubmitButton } from "./demo1-client";

export function Demo1() {
  return (
    <div className="not-prose -mx-7 my-6">
      <Browser url="http://localhost:3000/">
        <App />
      </Browser>
    </div>
  );
}

let defaultPosts = [
  { id: "1", title: "Hello world", content: "This is my first post" },
  { id: "2", title: "Edit me!!!", content: "You can really edit these posts!" },
  { id: "3", title: "Welcome post", content: "Welcome to my blog!" },
];

let postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

function getPosts() {
  try {
    let cookie = cookies.get("route-rendering-posts");
    let raw = cookie ? JSON.parse(cookie) : defaultPosts;
    let parsed = z.array(postSchema).safeParse(raw);
    return parsed.success ? parsed.data : defaultPosts;
  } catch {
    return defaultPosts;
  }
}

function getPostById(postId: string) {
  let posts = getPosts();
  return posts.find((post) => post.id === postId);
}

function App() {
  return (
    <RootLayout>
      <PostsLayout>
        <EditPost postId="1" />
      </PostsLayout>
    </RootLayout>
  );
}

async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-base text-white">
        <div className="font-bold tracking-tight">Blog Admin</div>
        <div>
          <img src={AlicePhoto} className="size-5 rounded-full" />
        </div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function PostsLayout({ children }: { children: ReactNode }) {
  let posts = getPosts();

  return (
    <div className="flex items-start">
      <div className="w-[175px]">
        <div className="text-sm font-medium text-gray-500">Posts</div>
        <ul className="mt-1 space-y-1">
          {posts.map((post) => (
            <li key={post.id}>
              <button className="text-blue-600 hover:underline">
                {post.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

let updateSchema = z.object({
  title: z.string(),
  content: z.string(),
});

function EditPost({ postId }: { postId: string }) {
  let post = getPostById(postId);

  if (!post) {
    return <div>Post not found</div>;
  }

  async function saveAction(formData: FormData) {
    "use server";

    let newPost = updateSchema.parse(Object.fromEntries(formData));
    let posts = getPosts();

    const newPosts = posts.map((p) =>
      p.id === post?.id
        ? {
            id: p.id,
            ...newPost,
          }
        : p,
    );

    cookies.set("route-rendering-posts", JSON.stringify(newPosts));
  }

  return (
    <div>
      <div className="text-xl font-bold tracking-tight">{post.title}</div>
      <form action={saveAction} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Title
          </label>
          <div className="mt-0.5">
            <input
              id="title"
              name="title"
              defaultValue={post.title}
              type="text"
              placeholder="Title"
              className="block w-full rounded-md bg-white px-2.5 py-1.5 text-sm/6 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="content"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Post content
          </label>
          <div className="mt-0.5">
            <textarea
              id="content"
              name="content"
              rows={4}
              className="block w-full rounded-md bg-white px-2.5 py-1.5 text-sm/6 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
              defaultValue={post.content}
            />
          </div>
        </div>
        <div>
          <SubmitButton>Save</SubmitButton>
        </div>
      </form>
    </div>
  );
}
