// POST /api/analyze
// Body:     { text: string }
// Response: { provider: "gemini" | "mock", suggestions: Suggestion[] }
//
// This is the "simple backend" the brief asks for: the browser calls this
// route, and only this route (running on the server) talks to the LLM with the key.

import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";

const MAX_CHARS = 2000;

export async function POST(request: Request) {
  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Please describe the problem" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Description is too long (max ${MAX_CHARS} characters)` },
      { status: 400 },
    );
  }

  const provider = getProvider();
  try {
    const suggestions = await provider.analyze(text);
    return NextResponse.json({ provider: provider.name, suggestions });
  } catch (err) {
    console.error(`[analyze] ${provider.name} failed:`, err);
    return NextResponse.json(
      { error: "The AI service is unavailable right now. Please try again." },
      { status: 502 },
    );
  }
}
