# Don't use Twofold

Twofold is an opinionated framework that is designed to be used in a specific way. Here are some reasons why you shouldn't use Twofold.

## Newer React features

Server components, server functions, and actions are a new concepts to React. Therefore any application built using Twofold is being built on the bleeding edge of React.

Personally, I believe architecture behind React Server Components is so powerful that it will change the future of React development over the upcoming years. Twofold is my bet on that, a bet on RSC and the future of React, but if I'm wrong then applications built with Twofold will suffer and be left behind.

## New concepts

Many concepts that fall under the RSC umbrella are still being worked out and are not widely adopted by today's most popular React libraries. You might face friction when trying to integrate Twofold with other libraries that are not built with RSC in mind.

There is also a significant learning curve when it comes to understanding how to build applications with these new concepts. While I want to Twofold to help make this learning as easy as possible, in its current state to be successful with Twofold you'll need to have a strong understanding of:

- Server components and client components
- Transitions and Actions
- New React APIs like `useOptimistic`, `useActionState`, and so on.

If you want to focus on other areas of application development instead of learning these new concepts then Twofold is not a good fit.

## Breaking changes

Due to the beta nature of the ideas in Twofold it is very likely that there will be breaking changes in the future. This means that if you build an application with Twofold today, you may need to rewrite parts of it in the future to keep up with the latest changes.

## My opinions

Twofold is built on my opinions and experiences as a developer.

I made Twofold to better write request-response based applications, backed by a database, that contain both server-side and client-side code. If you don't have a need for this then you won't find Twofold useful.

## Who should use Twofold

I believe the best use case for Twofold is for developers who are excited to experiment with React Server Components on small demo projects and weekend applications.

If you're still reading this, and you're still interested in Twofold, then check out the [getting started](/docs/guides/getting-started) guides to create your first app.
