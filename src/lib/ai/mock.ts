// Mock AI provider. Used automatically when no GEMINI_API_KEY is set, or when
// AI_PROVIDER=mock. It is a keyword matcher, NOT real understanding: it exists so
// reviewers can run the app without a key and so the UI can be developed offline.

import type { AiProvider } from "./provider";
import type { Category, Priority, Suggestion } from "@/lib/types";

// Keywords per category, English and Arabic. Order matters: first match wins.
const CATEGORY_KEYWORDS: Array<[Category, string[]]> = [
  ["ac", ["ac ", "a/c", "air con", "cooling", "split unit", "تكييف", "مكيف", "تبريد"]],
  ["plumbing", ["leak", "water", "pipe", "tap", "faucet", "drain", "toilet", "sink", "heater", "تسريب", "مويه", "ماء", "ماسورة", "سباك", "حنفية", "مجاري", "سخان"]],
  ["electrical", ["power", "electric", "socket", "outlet", "light", "breaker", "wire", "spark", "كهرباء", "كهربا", "فيش", "لمبة", "قاطع", "سلك"]],
  ["carpentry", ["door", "window", "cabinet", "wood", "hinge", "lock", "shelf", "باب", "شباك", "خزانة", "خشب", "قفل", "نجار"]],
  ["insulation", ["insulation", "damp", "humidity", "roof seal", "waterproof", "عزل", "رطوبة", "سطح"]],
  ["flooring", ["floor", "tile", "marble", "parquet", "carpet", "أرضية", "ارضية", "بلاط", "رخام", "باركيه", "سيراميك"]],
];

const URGENT_KEYWORDS = [
  "flood", "flooding", "burst", "spark", "burning", "smoke", "fire", "no power",
  "power is out", "power out", "exposed wire", "gas", "can't lock", "cannot lock",
  "emergency", "urgent", "immediately",
  "يغرق", "غرق", "طفح", "شرارة", "حريق", "دخان", "مقطوعة", "انقطعت", "غاز", "عاجل", "طارئ",
];

function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [category, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return category;
  }
  return "other";
}

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  return URGENT_KEYWORDS.some((w) => lower.includes(w)) ? "urgent" : "normal";
}

// Very rough splitting: sentence boundaries and common conjunctions.
function splitProblems(text: string): string[] {
  return text
    .split(/(?:[.!?؟\n]+|\band also\b|\band\b|\bplus\b|\balso\b|\s+و(?=\S)|،)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

export const mockProvider: AiProvider = {
  name: "mock",

  async analyze(text) {
    // Small artificial delay so the UI's loading state is visible.
    await new Promise((r) => setTimeout(r, 400));

    const parts = splitProblems(text);
    const suggestions: Suggestion[] = parts.map((part) => ({
      text: part,
      category: detectCategory(part),
      priority: detectPriority(part),
      reason: "Mock provider: matched on keywords only.",
    }));

    // If splitting produced nothing useful, treat the whole message as one problem.
    if (suggestions.length === 0 && text.trim()) {
      suggestions.push({
        text: text.trim(),
        category: detectCategory(text),
        priority: detectPriority(text),
        reason: "Mock provider: matched on keywords only.",
      });
    }
    return suggestions;
  },
};
