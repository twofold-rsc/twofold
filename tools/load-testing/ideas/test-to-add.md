# Load testing ideas

1. Concurrent request test

- Use 25–100 constant VUs rather than one sequential VU.
- Run for 10–30 minutes.
- Sample memory every 5–10 seconds from a separate low-rate scenario.
- Follow it with a recovery period.

1. Suspense/streaming test

- Target /react/suspense, which remains active for 1.5 seconds (react/suspense.page.tsx:17-19).
- Use a constant arrival rate that produces meaningful concurrency.
- For example, 20 requests/second produces roughly 30 simultaneously suspended requests.
- Verify memory returns after all streams complete.

1. Cancellation test

- Request /react/suspense or /routing/use-optimistic-route/slow-page-end.
- Set a k6 timeout well below the route’s 1.5–2 second delay.
- The timeout failures are intentional; verify their expected count separately.
- Follow each cancellation phase with successful requests and an idle recovery period.
