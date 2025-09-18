import { ReactNode, Suspense } from "react";
import AlicePhoto from "./alice.avif";
import cookies from "@twofold/framework/cookies";
import pageContext from "@twofold/framework/context/page";
import { flash } from "@twofold/framework/flash";
import z from "zod";
import {
  Client2,
  FlashAlerts,
  Placeholder,
  StackedApp,
  SubmitButton,
} from "./demo1-client";
import Spinner from "@/app/components/spinner";
import clsx from "clsx";
import Link from "@twofold/framework/link";
import { Arrow } from "../../components/arrows";

export function Demo1() {
  return (
    <div className="not-prose my-6 sm:-mx-8">
      <Suspense fallback={null}>
        <Client2>
          <RootLayout>
            <PostsLayout>
              <EditPost demoId={1} />
            </PostsLayout>
          </RootLayout>
        </Client2>
      </Suspense>
    </div>
  );
}

export function Demo3() {
  let waterfall = pageContext.searchParams.get("app.waterfall");
  let delay = typeof waterfall === "string" ? parseInt(waterfall) : 0;

  // use a suspense key so the boundaries have to rerender themselves.
  // this is so the reload button feels like its refreshing the app and
  // less like a transition.
  let suspenseKey =
    pageContext.searchParams.get("app.suspenseKey") ?? "default";

  return (
    <div className="not-prose group my-6 sm:-mx-8">
      <div className="relative z-10 mt-18">
        <div className="absolute transition-opacity group-has-[[data-loading]]:opacity-80 sm:-top-[54px] sm:left-[444px]">
          <div className="relative">
            <span className="font-handwriting absolute bottom-[42px] -left-[212px] text-xl font-semibold whitespace-nowrap text-red-500">
              Refresh to see waterfall
            </span>
            <Arrow className="pointer-events-none w-18 rotate-[180deg] border border-blue-500 text-red-500" />
          </div>
        </div>
      </div>
      <Client2 waterfall={1000}>
        <Suspense fallback={<Loading align="center" />} key={suspenseKey}>
          <RootLayout delay={delay}>
            <Suspense fallback={<Loading align="center" />}>
              <PostsLayout delay={delay}>
                <Suspense fallback={<Loading align="left" />}>
                  <EditPost delay={delay} demoId={3} />
                </Suspense>
              </PostsLayout>
            </Suspense>
          </RootLayout>
        </Suspense>
      </Client2>
    </div>
  );
}

export async function Demo4() {
  let waterfall = pageContext.searchParams.get("stack.waterfall");
  let delay = typeof waterfall === "string" ? parseInt(waterfall) : 0;

  // use a suspense key so the boundaries have to rerender themselves.
  // this is so the reload button feels like its refreshing the app and
  // less like a transition.
  let suspenseKey =
    pageContext.searchParams.get("stack.suspenseKey") ?? "default";

  let stack = [
    <Suspense fallback={<LoadingInParallel />} key={suspenseKey}>
      <RootLayout delay={delay} key="root-layout">
        <Placeholder />
      </RootLayout>
    </Suspense>,
    <PostsLayout delay={delay} key="posts-layout">
      <Placeholder />
    </PostsLayout>,
    <EditPost delay={delay} demoId={4} key="edit-post" />,
  ];

  return (
    <div className="not-prose my-6 sm:-mx-8">
      <StackedApp stack={stack} />
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

function Loading({ align }: { align: "left" | "center" }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center space-x-1.5 px-2 py-2",
        align === "left" ? "justify-start" : "justify-center",
      )}
      data-loading
    >
      <Spinner className="size-4" />
      <span>Loading...</span>
    </div>
  );
}

function LoadingInParallel() {
  return (
    <div className="flex items-center justify-center space-x-1.5 px-2 py-2">
      <Spinner className="size-4" />
      <span>Rendering all routes in parallel</span>
    </div>
  );
}

async function RootLayout({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
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
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
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
              <Link
                href={`/blog/parallel-and-recursive-route-rendering-with-rsc?postId=${post.id}`}
                mask={`/blog/parallel-and-recursive-route-rendering-with-rsc`}
                scroll="preserve"
                className="cursor-pointer text-blue-600 hover:underline"
              >
                {post.title}
              </Link>
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

function updatePost(demoId: number, postId: string, formData: FormData) {
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

  cookies.set("route-rendering-posts", JSON.stringify(newPosts));

  flash({
    demoId,
    type: "demo",
    demo: "route-rendering-blog-post",
    message: `Post "${newPost.title}" saved!`,
  });
}

async function EditPost({
  demoId,
  delay = 0,
}: {
  demoId: number;
  delay?: number;
}) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  let defaultPostId = getPosts()[0]?.id;
  let postId = pageContext.searchParams.get("postId") ?? defaultPostId;
  let post = getPostById(postId);

  if (!post) {
    return <div>Post not found. Try clearing your cookies...</div>;
  }

  async function save(formData: FormData) {
    "use server";
    updatePost(demoId, postId, formData);
  }

  let key = `${post.id}-${post.title}-${post.content}`;

  return (
    <div>
      <div className="text-xl font-bold tracking-tight">{post.title}</div>
      <form action={save} className="mt-4 space-y-4" key={key}>
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
              required
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
              required
              defaultValue={post.content}
              rows={4}
              className="block w-full rounded-md bg-white px-2.5 py-1.5 text-sm/6 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
            />
          </div>
        </div>
        <div>
          <SubmitButton>Save</SubmitButton>
        </div>
      </form>

      <FlashAlerts demoId={demoId} />
    </div>
  );
}
