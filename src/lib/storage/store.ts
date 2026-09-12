// The storage contract and the helpers both backends share.
// Kept separate from index.ts so the backends don't import the module that
// imports them (a circular import).

import type { ServiceRequest } from "@/lib/types";

export type NewRequest = Pick<ServiceRequest, "text" | "category" | "priority">;

export interface RequestStore {
  name: string;
  list(): Promise<ServiceRequest[]>;
  add(drafts: NewRequest[]): Promise<ServiceRequest[]>;
}

/** Shared by both backends so ids and timestamps are created identically. */
export function toServiceRequests(drafts: NewRequest[]): ServiceRequest[] {
  const now = new Date().toISOString();
  return drafts.map((d) => ({
    id: crypto.randomUUID(),
    text: d.text,
    category: d.category,
    priority: d.priority,
    createdAt: now,
  }));
}

export function newestFirst(items: ServiceRequest[]): ServiceRequest[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
