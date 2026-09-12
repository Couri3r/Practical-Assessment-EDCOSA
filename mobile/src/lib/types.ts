// Categories, priorities and the shared shapes.
//
// NOTE: this mirrors `../../src/lib/types.ts` in the web app. The two projects
// are separate npm packages with separate bundlers, so there is no import path
// between them without turning the repo into a monorepo workspace. For a
// two-screen demo a mirrored file was the lower-risk choice; see the README
// for what I would do with more time.

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

export const CATEGORY_LABELS: Record<Category, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  ac: "AC / Cooling",
  insulation: "Insulation",
  flooring: "Flooring",
  other: "Other",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: "Normal",
  urgent: "Urgent",
};

/** One problem the AI found in the user's message. */
export interface Suggestion {
  text: string;
  category: Category;
  priority: Priority;
  reason: string;
}

/** A suggestion the user confirmed and saved. */
export interface ServiceRequest {
  id: string;
  text: string;
  category: Category;
  priority: Priority;
  createdAt: string;
}
