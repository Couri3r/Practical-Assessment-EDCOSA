// Real AI provider using Google Gemini.
// This file only runs on the server (API routes), so the key never reaches the browser.

import { GoogleGenAI } from "@google/genai";
import type { AiProvider } from "./provider";
import { normalizeSuggestions } from "./provider";
import { RESPONSE_SCHEMA, SYSTEM_PROMPT } from "./prompt";

// Free-tier friendly default. Override with GEMINI_MODEL in .env.local.
const DEFAULT_MODEL = "gemini-3.6-flash";

export const geminiProvider: AiProvider = {
  name: "gemini",

  async analyze(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    const response = await ai.models.generateContent({
      model,
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0.2, // classification: we want consistency, not creativity
      },
    });

    const parsed = JSON.parse(response.text ?? "{}") as { problems?: unknown };
    return normalizeSuggestions(parsed.problems);
  },
};
