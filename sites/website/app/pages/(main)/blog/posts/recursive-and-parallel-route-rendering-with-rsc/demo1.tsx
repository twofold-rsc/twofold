import { ReactNode, Suspense } from "react";
import AlicePhoto from "./alice.avif";
import cookies from "@twofold/framework/cookies";
import { flash } from "@twofold/framework/flash";
import z from "zod";
import { Client2, Form, LinkButton, SubmitButton } from "./demo1-client";
import Spinner from "@/app/components/spinner";
import clsx from "clsx";

async function reload(postId?: string, waterfall?: number) {
  "use server";
  return <App postId={postId} waterfall={waterfall} />;
}

async function navigate(postId: string) {
  "use server";
  return <App postId={postId} />;
}

async function save(postId: string, formData: FormData) {
  "use server";

  let newPost = updateSchema.parse(Object.fromEntries(formData));
  let posts = getPosts();
  let post = posts.find((p) => p.id === postId);

  const newPosts = posts.map((p) =>
    p.id === post?.id
      ? {
          id: p.id,
          ...newPost,
        }
      : p,
  );

  flash({
    // TODO: add demo id or something
    type: "demo",
    demo: "route-rendering-blog-post",
    message: `Post "${newPost.title}" saved!`,
  });

  cookies.set("route-rendering-posts", JSON.stringify(newPosts));

  return <App postId={postId} />;
}

export function Demo1() {
  return (
    <div className="not-prose my-6">
      <Client2 app={<App />} reload={reload} navigate={navigate} save={save} />
    </div>
  );
}

export function Demo3() {
  async function reloadWithWaterfall(postId?: string) {
    "use server";

    return reload(postId, 1500);
  }

  return (
    <div className="not-prose my-6">
      <Client2
        app={<App />}
        reload={reloadWithWaterfall}
        navigate={navigate}
        save={save}
      />
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

function App({ postId, waterfall }: { postId?: string; waterfall?: number }) {
  let defaultPostId = getPosts()[0]?.id;
  let delay = waterfall ?? 0;

  return (
    <Suspense fallback={<Loading align="center" />}>
      <RootLayout delay={delay}>
        <Suspense fallback={<Loading align="center" />}>
          <PostsLayout delay={delay}>
            <Suspense fallback={<Loading align="left" />}>
              <EditPost postId={postId ?? defaultPostId} delay={delay} />
            </Suspense>
          </PostsLayout>
        </Suspense>
      </RootLayout>
    </Suspense>
  );
}

function Loading({ align }: { align: "left" | "center" }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center space-x-1.5 px-2 py-2",
        align === "left" ? "justify-start" : "justify-center",
      )}
    >
      <Spinner className="size-4" />
      <span>Loading...</span>
    </div>
  );
}

async function RootLayout({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  return (
    <div>
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-base text-white">
        <div className="font-bold tracking-tight">Blog Admin</div>
        <div className="relative">
          <img src={AlicePhoto} className="size-5 rounded-full" />
          <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
          <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border-2 border-gray-800 bg-green-400" />
        </div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

async function PostsLayout({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  let posts = getPosts();

  return (
    <div className="flex items-start">
      <div className="w-[175px]">
        <div className="text-sm font-medium text-gray-500">Posts</div>
        <ul className="mt-1 space-y-1">
          {posts.map((post) => (
            <li key={post.id}>
              <LinkButton
                postId={post.id}
                className="cursor-pointer text-blue-600 hover:underline"
              >
                {post.title}
              </LinkButton>
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

async function EditPost({ postId, delay }: { postId: string; delay: number }) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  let post = getPostById(postId);

  if (!post) {
    return <div>Post not found. Try clearing your cookies...</div>;
  }

  return (
    <div>
      <div className="text-xl font-bold tracking-tight">{post.title}</div>
      <Form postId={postId} className="mt-4 space-y-4" key={post.id}>
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
              defaultValue={post.content}
              rows={4}
              className="block w-full rounded-md bg-white px-2.5 py-1.5 text-sm/6 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
            />
          </div>
        </div>
        <div>
          <SubmitButton>Save</SubmitButton>
        </div>
      </Form>
    </div>
  );
}
