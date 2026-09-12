// Requests page (/requests): lists every saved request.
//
// This is a Server Component: it runs on the server and reads the JSON file
// directly, so there is no client-side fetch and no loading spinner.
// "force-dynamic" tells Next.js to re-run it on every visit instead of
// caching the HTML at build time, since the data changes.

import Link from "next/link";
import { listRequests } from "@/lib/storage";
import { CategoryBadge, PriorityBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RequestsPage() {
  const requests = await listRequests();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="mt-1 text-gray-600">
            {requests.length === 0
              ? "Nothing submitted yet."
              : `${requests.length} request${requests.length === 1 ? "" : "s"}, newest first.`}
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          <p>Your submitted requests will show up here.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            Submit your first request
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                r.priority === "urgent" ? "border-red-200" : "border-gray-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={r.category} />
                <PriorityBadge priority={r.priority} />
                <time dateTime={r.createdAt} className="ml-auto text-xs text-gray-500">
                  {formatDate(r.createdAt)}
                </time>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-800" dir="auto">
                {r.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
