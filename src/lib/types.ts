// Shared types used by the backend (API routes, AI, storage) and the UI.
// Keeping the allowed values in one place means adding a category is a one-line change.

export const CATEGORIES = [
  "plumbing",
  "electrical",
  "carpentry",
  "ac",
  "insulation",
  "flooring",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["normal", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

// Human-friendly labels for the UI. Keys are the machine values above.
export const CATEGORY_LABELS: Record<Category, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  ac: "AC / Cooling",
  insulation: "Insulation",
  flooring: "Flooring",
  other: "Other",
};

// What the AI returns for ONE problem. If the user described several
// problems in one message, the AI returns several of these.
export interface Suggestion {
  text: string; // the part of the user's message that describes this problem
  category: Category;
  priority: Priority;
  reason: string; // one short sentence: why this category and priority
}

// A suggestion the user confirmed and saved.
export interface ServiceRequest {
  id: string;
  text: string;
  category: Category;
  priority: Priority;
  createdAt: string; // ISO 8601 timestamp
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}
