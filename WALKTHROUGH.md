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
The route validates each item and appends them to `data/requests.json`. The
form navigates to `/requests`, which reads the file and renders the list.

## Likely live-review changes and where to make them

| They ask for | Change |
|---|---|
| Add a category, e.g. "painting" | `types.ts`: add to `CATEGORIES` and `CATEGORY_LABELS`. Prompt picks it up automatically via `JSON.stringify(CATEGORIES)`. Add a line describing it in `prompt.ts`. Optionally add keywords in `mock.ts`. |
| Add a third priority, e.g. "low" | `types.ts`: add to `PRIORITIES` and `PRIORITY_LABELS`. `prompt.ts`: describe when to use it. The badge and the toggle buttons read labels from the map, so they update automatically. The red-vs-blue styling checks `=== "urgent"`, so a third value gets the neutral style by default. |
| Delete a request | Add `DELETE` to `api/requests/route.ts` (or `api/requests/[id]/route.ts`), add `removeRequest(id)` in `storage.ts`, add a button in `requests/page.tsx` (it would need to become a client component, or use a small client `DeleteButton`). |
| Filter the list by priority | In `requests/page.tsx`, read `searchParams` and filter before rendering, or add a client-side filter component. |
| Switch to OpenAI | New `lib/ai/openai.ts` implementing `AiProvider`; add one line in `getProvider()`. |
| Use SQLite instead of JSON | Rewrite `listRequests` and `addRequests` in `storage.ts`. Nothing else changes. |
| Make the AI stricter about splitting | Edit the rule in `prompt.ts`. |
| Show which provider answered | Already returned by `/api/analyze` as `provider`. |

## Things worth being able to say out loud

- "Why one call instead of two?" One call has full context to decide if it's
  one problem or two, and halves latency and quota use.
- "Why validate after the schema?" Defence in depth. Schemas reduce bad
  output, they don't eliminate it, and the UI must never crash.
- "Why a JSON file?" Survives restarts, no native deps, readable during a
  review. Behind two functions so it's swappable.
- "Why is the list page a server component?" No interactivity, so no reason
  to ship JavaScript for it. It reads storage directly.
- "What would break in production?" Single JSON file on one machine. Would
  move to a database first, then add auth and rate limiting.
