# Walkthrough (study notes for the live review)

This file is for you, not the reviewers. Delete it before submitting or keep it, your call.

## The 6 Next.js ideas this project uses, and nothing else

1. **File-based routing.** A folder under `src/app/` with a `page.tsx` is a URL.
   `src/app/page.tsx` is `/`. `src/app/requests/page.tsx` is `/requests`.

2. **Route handlers = the backend.** A `route.ts` file under `src/app/api/...`
   exports functions named after HTTP methods (`GET`, `POST`). They run on the
   server only. That is where the API key is used. The browser calls them with
   `fetch("/api/analyze")`.

3. **Server Components are the default.** Any component in `src/app/` runs on
   the server unless it says otherwise. It can read files, use env vars, be
   `async`. `requests/page.tsx` is one: it calls `listRequests()` directly.

4. **`"use client"` at the top of a file makes it a Client Component.** You need
   it whenever you use `useState`, `onClick`, `useRouter`, `usePathname`.
   `NewRequestForm.tsx` and `Nav.tsx` are client components. A server
   component can render a client component (that is what `page.tsx` does).

5. **`layout.tsx` wraps every page.** The nav bar and the `<main>` container
   live there once.

6. **Env vars.** `.env.local` is read on the server. A variable is only sent
   to the browser if it starts with `NEXT_PUBLIC_`. Ours doesn't, so the key
   stays on the server. That is the whole "protect the key" story.

Bonus: `export const dynamic = "force-dynamic"` on the requests page tells
Next.js not to pre-render that page at build time, because its data changes.

## The request lifecycle in one breath

User types text, clicks Submit. The form POSTs to `/api/analyze`. The route
picks a provider (Gemini if key, else mock), the provider returns a list of
suggestions, the route sends them back. The form shows one editable card per
suggestion. User clicks Confirm. The form POSTs the cards to `/api/requests`.
The route validates each item and hands them to the storage layer, which
appends them to `data/requests.json` locally or to Redis when deployed. The
form navigates to `/requests`, which reads them back and renders the list.

## Likely live-review changes and where to make them

| They ask for | Change |
|---|---|
| Add a category, e.g. "painting" | `types.ts`: add to `CATEGORIES` and `CATEGORY_LABELS`. Prompt picks it up automatically via `JSON.stringify(CATEGORIES)`. Add a line describing it in `prompt.ts`. Optionally add keywords in `mock.ts`. |
| Add a third priority, e.g. "low" | `types.ts`: add to `PRIORITIES` and `PRIORITY_LABELS`. `prompt.ts`: describe when to use it. The badge and the toggle buttons read labels from the map, so they update automatically. The red-vs-blue styling checks `=== "urgent"`, so a third value gets the neutral style by default. |
| Delete a request | Add `DELETE` to `api/requests/route.ts` (or `api/requests/[id]/route.ts`), add `remove(id)` to the `RequestStore` interface in `storage/store.ts` and to both backends, add a button in `requests/page.tsx` (it would need to become a client component, or use a small client `DeleteButton`). |
| Filter the list by priority | In `requests/page.tsx`, read `searchParams` and filter before rendering, or add a client-side filter component. |
| Switch to OpenAI | New `lib/ai/openai.ts` implementing `AiProvider`; add one line in `getProvider()`. |
| Use SQLite/Postgres instead | Add `storage/sqlite.ts` implementing `RequestStore`, add one line to `getStore()` in `storage/index.ts`. Nothing else changes. |
| Why two storage backends? | Serverless hosts have a read-only filesystem, so the JSON file works locally but not deployed. Same interface, picked by env vars. |
| Make the AI stricter about splitting | Edit the rule in `prompt.ts`. |
| Show which provider answered | Already returned by `/api/analyze` as `provider`. |

## The mobile app, in the same spirit

Expo Router works like the Next.js app directory: `mobile/src/app/index.tsx` is
the first screen, `requests.tsx` is the second, `_layout.tsx` wraps both and
draws the tab bar. If you can explain the web routing you can explain this.

Four things to know:

1. **Expo is React Native.** React Native renders real native Android views from
   React code. Expo is the toolchain around it: Expo Go on the phone loads your
   app over Wi-Fi so you never install Android Studio. The alternative, bare
   React Native, needs the full Android SDK and a Gradle build.
2. **It talks to the same backend.** `mobile/src/lib/api.ts` is the only file
   that does networking. Adding mobile needed no backend change at all, because
   `GET /api/requests` already existed.
3. **It finds the server by itself.** The phone downloaded the app from Metro on
   your PC, so Expo already knows your PC's address. `api.ts` reuses that host
   and swaps port 8081 for 3000. Nothing is hard-coded.
4. **No HTML here.** `View` replaces `div`, `Text` replaces `p`, `Pressable`
   replaces `button`, and styles are objects in `StyleSheet.create` rather than
   CSS classes. Every string of text must sit inside a `Text`.

| They ask for (mobile) | Change |
|---|---|
| Change a colour | `mobile/src/lib/theme.ts`. Everything reads from there. |
| Add a screen | Add a file under `mobile/src/app/`, add a `Tabs.Screen` in `_layout.tsx`. |
| Point at a deployed backend | Set `EXPO_PUBLIC_API_URL` in `mobile/.env`. |
| Add a category | Same as web, but edit the mirrored `mobile/src/lib/types.ts` too. |

## Things worth being able to say out loud

- "Why one call instead of two?" One call has full context to decide if it's
  one problem or two, and halves latency and quota use.
- "Why validate after the schema?" Defence in depth. Schemas reduce bad
  output, they don't eliminate it, and the UI must never crash.
- "Why a JSON file locally but Redis deployed?" Serverless hosts have a
  read-only filesystem, so the file backend physically cannot write there. Both
  implement the same `RequestStore` interface and `getStore()` picks one from
  env vars, so no calling code changed when I added the second.
- "Why is the list page a server component?" No interactivity, so no reason
  to ship JavaScript for it. It reads storage directly.
- "What would break in production?" The Redis list is global and unpaginated,
  and `/api/analyze` has no rate limit, so a public URL spends my Gemini quota.
  Auth, per-user scoping and rate limiting would come first.
- "Does the mobile app depend on the web app?" No. Both are clients of the same
  backend. The mobile app never calls the web UI. If the API moved to its own
  service, the mobile app would change by one line.
- "Why is `types.ts` duplicated?" Two bundlers, two npm packages, no import path
  without a monorepo. A deliberate tradeoff, flagged in the README, and the
  first thing I'd fix.
