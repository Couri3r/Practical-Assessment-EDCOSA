// Storage picks its backend the same way the AI layer picks a provider:
// one interface, two implementations, chosen from environment variables.
//
// Local development  -> a JSON file on disk (no setup, easy to inspect)
// Deployed           -> Redis (serverless filesystems are read-only)
//
// Nothing outside this folder knows or cares which one is running.

import type { ServiceRequest } from "@/lib/types";
import { fileStore } from "./file";
import { isRedisConfigured, redisStore } from "./redis";
import type { NewRequest, RequestStore } from "./store";

export type { NewRequest, RequestStore } from "./store";

export function getStore(): RequestStore {
  return isRedisConfigured() ? redisStore : fileStore;
}

/** All saved requests, newest first. */
export function listRequests(): Promise<ServiceRequest[]> {
  return getStore().list();
}

/** Save one or more confirmed requests. Returns the saved records. */
export function addRequests(drafts: NewRequest[]): Promise<ServiceRequest[]> {
  return getStore().add(drafts);
}
