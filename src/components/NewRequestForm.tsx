"use client";
// The whole submit flow lives here. It is a Client Component because it holds
// state (the text, the AI suggestions, loading flags) and handles clicks.
//
// Flow:  describe  ->  Analyze (calls /api/analyze)  ->  review & edit  ->  Save (calls /api/requests)

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  type Category,
  type Priority,
  type Suggestion,
} from "@/lib/types";
import { PriorityBadge } from "./Badges";

const EXAMPLES = [
  "Water is leaking under the kitchen sink and flooding the floor",
  "The AC in the living room blows warm air",
  "عندي تسريب مويه بالمطبخ وبنفس الوقت الكهرباء مقطوعة بغرفة النوم",
];

export default function NewRequestForm() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (data.suggestions.length === 0) {
        setError("We couldn't find a maintenance problem in that text. Try describing what is broken.");
        return;
      }
      setSuggestions(data.suggestions);
      setProvider(data.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateSuggestion(index: number, patch: Partial<Suggestion>) {
    setSuggestions((prev) => prev!.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSuggestion(index: number) {
    setSuggestions((prev) => prev!.filter((_, i) => i !== index));
  }

  async function save() {
    if (!suggestions) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: suggestions.map(({ text, category, priority }) => ({ text, category, priority })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      router.push("/requests");
      router.refresh(); // make sure the list page re-reads storage
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  function startOver() {
    setSuggestions(null);
    setProvider(null);
    setError(null);
  }

  // ---------- Step 1: describe the problem ----------
  if (!suggestions) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">What needs fixing?</h1>
          <p className="mt-1 text-gray-600">
            Describe the problem in your own words, in English or Arabic. We&apos;ll suggest the right specialist.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="e.g. Water is dripping from the bathroom ceiling and the light in the hallway doesn't work"
          className="w-full rounded-xl border border-gray-300 bg-white p-4 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          dir="auto"
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              dir="auto"
            >
              {ex.length > 44 ? ex.slice(0, 44) + "…" : ex}
            </button>
          ))}
        </div>

        {error && <ErrorBox message={error} />}

        <button
          type="button"
          onClick={analyze}
          disabled={analyzing || !text.trim()}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? "Analyzing…" : "Submit"}
        </button>
      </div>
    );
  }

  // ---------- Step 2: review, edit, confirm ----------
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review the suggestion</h1>
        <p className="mt-1 text-gray-600">
          {suggestions.length > 1
            ? `We found ${suggestions.length} separate problems and split them into ${suggestions.length} requests. `
            : "Check the category and priority. "}
          You can change anything before saving.
        </p>
        {provider === "mock" && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Running in mock mode (no API key configured): results are keyword-based.
          </p>
        )}
      </div>

      <ul className="space-y-4">
        {suggestions.map((s, i) => (
          <li key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Request {suggestions.length > 1 ? i + 1 : ""}
              </span>
              {suggestions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSuggestion(i)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Problem</span>
              <textarea
                value={s.text}
                onChange={(e) => updateSuggestion(i, { text: e.target.value })}
                rows={3}
                dir="auto"
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            {/* Stacks on phones, side by side from the sm breakpoint up. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Category</span>
                <select
                  value={s.category}
                  onChange={(e) => updateSuggestion(i, { category: e.target.value as Category })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Priority</legend>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateSuggestion(i, { priority: p as Priority })}
                      className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                        s.priority === p
                          ? p === "urgent"
                            ? "border-red-500 bg-red-50 text-red-800"
                            : "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {s.reason && (
              <p className="flex items-start gap-2 text-xs text-gray-500">
                <PriorityBadge priority={s.priority} />
                <span>AI: {s.reason}</span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {error && <ErrorBox message={error} />}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={startOver}
          disabled={saving}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          Back
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || suggestions.length === 0}
          className="w-full flex-1 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : suggestions.length > 1
              ? `Confirm & save ${suggestions.length} requests`
              : "Confirm & save"}
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
      {message}
    </p>
  );
}
