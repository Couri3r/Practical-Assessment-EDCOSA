// The only place the mobile app talks to the network.
//
// It calls the SAME backend as the web app (the Next.js route handlers), so the
// Gemini API key stays on the server and never ships inside the mobile bundle.

import Constants from "expo-constants";
import type { Category, Priority, ServiceRequest, Suggestion } from "./types";

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Work out where the backend lives.
 *
 * In development the phone downloaded this bundle from Metro running on the dev
 * machine, and Expo records that address in `hostUri` (e.g. "192.168.1.2:8081").
 * We reuse the host and swap in the Next.js port, so no IP has to be hard-coded.
 * Set EXPO_PUBLIC_API_URL in mobile/.env to point somewhere else (e.g. a
 * deployed backend).
 */
function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/+$/, "");

  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:3000`;

  return "http://localhost:3000";
}

export const API_BASE_URL = resolveBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    // Network-level failure: wrong IP, server not running, different Wi-Fi.
    throw new Error(
      `Couldn't reach the server at ${API_BASE_URL}.\n\n` +
        `Check that "npm run dev" is running on your computer and that the phone is on the same Wi-Fi.`,
    );
  } finally {
    clearTimeout(timer);
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data as T;
}

/** Ask the AI to classify the description, splitting it if it holds several problems. */
export function analyzeProblem(text: string) {
  return request<{ provider: string; suggestions: Suggestion[] }>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/** Save confirmed requests. */
export function saveRequests(
  items: Array<Pick<ServiceRequest, "text"> & { category: Category; priority: Priority }>,
) {
  return request<{ requests: ServiceRequest[] }>("/api/requests", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

/** All saved requests, newest first. */
export function listRequests() {
  return request<{ requests: ServiceRequest[] }>("/api/requests");
}
