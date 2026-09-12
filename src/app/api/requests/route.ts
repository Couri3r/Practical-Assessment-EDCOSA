// GET  /api/requests            -> { requests: ServiceRequest[] }  (newest first)
// POST /api/requests            -> { requests: ServiceRequest[] }  (the ones just saved)
//      Body: { items: Array<{ text, category, priority }> }
//
// The web UI's Requests page reads storage directly (it is a server component),
// but this GET exists so a future mobile app can use the same backend.

import { NextResponse } from "next/server";
import { addRequests, getStore, listRequests } from "@/lib/storage";
import { isCategory, isPriority } from "@/lib/types";

export async function GET() {
  try {
    const requests = await listRequests();
    return NextResponse.json({ requests });
  } catch (err) {
    console.error(`[requests] read from ${getStore().name} failed:`, err);
    return NextResponse.json({ error: "Could not load requests." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  // Validate every item before saving anything, so a bad item rejects the whole batch.
  const drafts = [];
  for (const item of body.items as unknown[]) {
    const rec = (item ?? {}) as Record<string, unknown>;
    const text = typeof rec.text === "string" ? rec.text.trim() : "";
    if (!text || !isCategory(rec.category) || !isPriority(rec.priority)) {
      return NextResponse.json({ error: "Each item needs text, a valid category and a valid priority" }, { status: 400 });
    }
    drafts.push({ text, category: rec.category, priority: rec.priority });
  }

  try {
    const saved = await addRequests(drafts);
    return NextResponse.json({ requests: saved }, { status: 201 });
  } catch (err) {
    const store = getStore();
    console.error(`[requests] write to ${store.name} failed:`, err);

    // The most likely cause in production: deployed to a serverless host, whose
    // filesystem is read-only, without configuring the Redis backend.
    const hint =
      store.name === "json-file" && process.env.VERCEL
        ? "This deployment is using file storage, which cannot write on a serverless host. Connect the Upstash Redis integration (see the README)."
        : "Could not save your request. Please try again.";
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
