---
publishedAt: "2025-08-10T08:00:00Z"
description: "Learn how React's cache function keeps your components predictable and consistent."
---

# React Cache: It's about consistency

If you've spent any time with data fetching and React Server Components, you've probably reached for React's [`cache`](https://react.dev/reference/react/cache) function a handful of times.

In this post, I want to make the case for appreciating `cache` as more than just a memoization and optimization technique for network data fetching, but instead as an API that guarantees consistency across an entire RSC render.

But first, let's look at one of the most common ways `cache` is used today.

## Deduplicating data fetches

React's `cache` is often used to deduplicate requests made by multiple components that need access to the same external data.

Here's an example of two components that both need the source HTML of [react.dev's](https://react.dev) homepage:

{% demo1 %}

```jsx {% demo=true %}
import { cache } from "react";

export default function Page() {
  return (
    <div>
      <ReactsPageTitle />
      <ReactsPageDescription />
    </div>
  );
}

async function ReactsPageTitle() {
  const reactsHtml = await getPage("https://react.dev");
  const title = reactsHtml.match(/<title>(.*?)<\/title>/)[1];
  return (
    <div>
      <p>Page title: {title}</p>
    </div>
  );
}

async function ReactsPageDescription() {
  const reactsHtml = await getPage("https://react.dev");
  const description = reactsHtml.match(
    /<meta name="description" content="(.*?)"/,
  )[1];
  return (
    <div>
      <p>Page description: {description}</p>
    </div>
  );
}

const getPage = cache(async (url) => {
  const res = await fetch(url);
  const html = await res.text();
  return html;
});
```

{% /demo1 %}

This is where `cache` really shines. Both `<ReactsPageTitle>` and `<ReactsPageDescription>` need the same data, but rather than hoist the fetch up to the parent component and pass it down as a prop, we use `cache` to ensure that only one fetch is made and shared between the two components. This lets each component have local data fetching without worrying about duplicated requests.

## More than an optimization

Now here's something interesting about the example above: Our two components would behave exactly the same way if the call to `cache` was removed. You could argue that it wouldn't be optimal to do so, but setting that aside the end result rendered by both components would be the same wether `cache` was used or not.

This might lead you to believe that `cache` is a memoization and optimization technique, only to be reached for when dealing with slow external data fetches used by multiple components. However, I think there's more to it than that and I'm going to try to convince you of that in this post.

## Consistency with external fetches

First, let's use a data-fetching function that doesn't use `cache`. We're going to write an app without `cache`, show a non-obvious bug that arises, and then fix it only using `cache`.

```jsx
// This function does not use cache

function getPage(url) {
  const res = await fetch(url);
  const html = await res.text();
  return html;
};
```

Also, our example that fetches the HTML from react.dev is too simple, let's make the React tree a bit more complicated by introducing a slow component that takes some time to render:

```jsx
export default function Page() {
  return (
    <div>
      <ReactsPageTitle />

      <Suspense fallback={<div>Loading...</div>}>
        {/* [!code ++] */}
        <SlowComponent>
          <ReactsPageDescription />
          {/* [!code ++] */}
        </SlowComponent>
      </Suspense>
    </div>
  );
}
```

What slow component does isn't necessarily important, but what matters is that it's a slow to render component. Luckily, it's wrapped in `<Suspense>` so we see something while it loads.

Oh, and we just introduced a potential bug here. Do you see it?

## Inconsistent data

Since `<ReactsPageDescription>` is now wrapped in `<SlowComponent>`, it renders later than `<ReactsPageTitle>`. This creates a gap between each component's data fetch and if the HTML on react.dev changes during that gap, we end up with inconsistent data.

It might seem unlikely that the HTML on react.dev would change while our app is rendering, but it's not impossible. We don't want to display a title and description that don't belong together when that happens.

{% demo2 /%}

You can think of this like UI tearing, where two components are rendered with contradictory versions of the same data. Any user looking at the above UI is going to be confused.

This is why we wrap `getPage` in `cache()`. Doing so ensures that both `<ReactsPageTitle>` and `<ReactsPageDescription>` always use the same version of react.dev's HTML, even if they render at different times.

```jsx
// Here's how we fix the tearing bug:

import { cache } from "react";

// [!code highlight]
const getPage = cache(async (url) => {
  const res = await fetch(url);
  const html = await res.text();
  return html;
});
```

Now any component that calls `getPage("https://react.dev")` will get the same result. Even if a new version of react.dev is deployed while our app is mid-render.

It's worth pointing out here that React's cache is _extremely_ short lived. It only lasts for the duration of the current RSC render. Refreshing the page will cause a new fetch and new cache to be created. The cache exists to provide consistency across the current render, not to cache data for future renders.

Some RSC frameworks, like [Next.js](https://nextjs.org/), automatically wrap fetch requests in `cache()` for you. It's less likely you'll run into consistency issues when fetches are made through `cache` by default.

However, for non-fetch requests like SQL queries, it's important to know how to use `cache` for consistency.

## Consistency with SQL queries

Here's a sales dashboard that uses two components to show the total sales volume and amount by querying an SQL database.

```jsx
export function DashboardPage() {
  return (
    <div>
      <TotalSalesVolume />
      <TotalSalesAmount />
    </div>
  );
}

async function TotalSalesVolume() {
  const result = await db.query("SELECT count(*) as volume FROM sales");
  return <div>Total sales volume: {result.volume}</div>;
}

async function TotalSalesAmount() {
  const result = await db.query("SELECT SUM(amount) as amount FROM sales");
  return <div>Total sales amount: {result.amount}</div>;
}
```

In the above code, each component queries the sales table and displays some data related to sales.

However, if we introduce `<SlowComponent>` into this tree we run into the same problem as before.

```jsx
export default function Page() {
  return (
    <div>
      <TotalSalesVolume />

      <Suspense fallback={<div>Loading...</div>}>
        {/* [!code ++] */}
        <SlowComponent>
          <TotalSalesAmount />
          {/* [!code ++] */}
        </SlowComponent>
      </Suspense>
    </div>
  );
}
```

Now our two sales components are rendering at different times, which means that if a new sale is made while our app is rendering, we're going to end up with inconsistent data.

This one is a bit trickier to solve, since both components are querying the sales table independently. Caching one query doesn't help us with the other.

We need to find a piece of data that will hold consistency across both components for the entirety of the RSC render.

How about the date?

```jsx
import { cache } from "react";

// [!code highlight]
const now = cache(() => new Date());

const getSalesVolume = cache(() =>
  db.query("SELECT count(*) as volume FROM sales where created_at <= ?", [
    now(), // [!code highlight]
  ]),
);

const getSalesAmount = cache(() =>
  db.query("SELECT SUM(amount) as amount FROM sales where created_at <= ?", [
    now(), // [!code highlight]
  ]),
);

async function TotalSalesVolume() {
  const result = await getSalesVolume();
  return <div>Total sales volume: {result.volume}</div>;
}

async function TotalSalesAmount() {
  const result = await getSalesAmount();
  return <div>Total sales amount: {result.amount}</div>;
}
```

The current date is given to whichever component first calls `now()`, and any component that later calls `now()` is given the same date as the first. This lets both components query the sales table using the same point in time, even if they render at different times.

What's interesting about this example is we're not using `cache` to deduplicate and speed up a slow data fetch. `new Date()` is fast, and we're certainly not worried about the performance of calling it multiple times. Instead, we're using `cache` because we want `new Date()` to be consistent across the RSC render so that any component accessing the database can query the same point in time.

Personally, I've found dashboard pages, which often contain many SQL queries and multiple `<Suspense>` boundaries, to be the perfect breeding ground for these types of consistency issues. Using `cache` fixes these issues by ensuring that all components see the same data.

## Impure data

What do fetch requests, SQL queries, and JavaScript's Date constructor all have in common?

They all access impure data.

These functions are impure because they can return different results each time they are called. The commonality here is that they rely on external data that changes over time.

There are many other examples of impure functions, such as functions that read from the file system, generate random numbers, or access information about the current request, user, or environment.

{% demo3 /%}

These impure functions are the enemy of consistency. Since they can return different values each time they are called, they open the door for your React components to render a page that's contradictory and confusing.

## Predictable trees

When I think about React components that are easy to work with the word _predictability_ comes to mind. React components should have predictable output, regardless of how many times they are rendered, where in the tree they are rendered, or if they are wrapped in a slow component or Suspense boundary.

With React Server Components we got the ability to fetch data in a component, so they become less predictable across _multiple_ renders. Data can change, and when you refresh the page you expect to see the latest version of the data.

But for the _same_ render, components should have consistent and predictable output. Which means that if a component uses impure data it should use `cache` for consistency.

For example, I would expect all the `<ReactsPageTitle>` components in this tree to have the same output.

```jsx
function Page() {
  return (
    <div>
      {/* [!code highlight] */}
      <ReactsPageTitle />

      <Suspense>
        {/* [!code highlight] */}
        <ReactsPageTitle />
      </Suspense>

      <Suspense>
        <SlowComponent>
          {/* [!code highlight] */}
          <ReactsPageTitle />
        </SlowComponent>
      </Suspense>
    </div>
  );
}

async function ReactsPageTitle() {
  // fetch and return the page title from react.dev
  // ....
}
```

And I would consider it a bug if any of these components outputted something different from the others. The only way to guarantee predictable output here to use `cache`.

## Impure access

Imagine for a minute that React knew when you were accessing impure data, and it threw an error if you forgot to wrap it in `cache`. Any fetch request, SQL query, or new date would need to use `cache` from the moment you wrote it.

That would force you to think about your data-fetching functions and put them neatly into little impure `cache` boxes from the moment you wrote them. You'd avoid a number of consistency bugs and your components would become more predictable.

While I think this might be a neat idea to explore, I can see most developers _absolutely hating_ it. For starters, there would be a lot of boilerplate involved for any data-fetching function.

But it's a good thought experiment to think through whenever you create a new component that accesses impure data.

- Do you want the component to be reusable?
- Do you want the component to be renderable anywhere in the tree?
- Do you want the component to be predictable?

If the answer to these questions is yes then it's important to know about `cache` and consistency in React Server Components.

Thanks for reading! I love talking about React and RSCs. If you have any questions or comments please reach out to me on [Twitter](https://x.com/ryantotweets) or [Bluesky](https://bsky.app/profile/ryantoron.to).
