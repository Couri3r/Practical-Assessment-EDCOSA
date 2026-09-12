// The rest of the app only ever talks to an "AiProvider".
// Which one runs (Gemini or Mock) is decided here, in one place, from env vars.

import { isCategory, isPriority, type Suggestion } from "@/lib/types";
import { geminiProvider } from "./gemini";
import { mockProvider } from "./mock";

export interface AiProvider {
  name: string;
  analyze(text: string): Promise<Suggestion[]>;
}

export function getProvider(): AiProvider {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced === "mock") return mockProvider;
  if (process.env.GEMINI_API_KEY) return geminiProvider;
  // No key configured: fall back to the mock so the app still runs.
  return mockProvider;
}

// Defensive cleanup applied to whatever a provider returns.
// Even with a JSON schema, we never trust model output blindly.
export function normalizeSuggestions(raw: unknown): Suggestion[] {
  if (!Array.isArray(raw)) return [];

  const cleaned: Suggestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const text = typeof rec.text === "string" ? rec.text.trim() : "";
    if (!text) continue;

    cleaned.push({
      text,
      category: isCategory(rec.category) ? rec.category : "other",
      priority: isPriority(rec.priority) ? rec.priority : "normal",
      reason: typeof rec.reason === "string" ? rec.reason.trim() : "",
    });
  }
  return cleaned;
}
