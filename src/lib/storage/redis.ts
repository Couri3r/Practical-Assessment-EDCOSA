// Redis backend (Upstash). Used when the app is deployed, because serverless
// hosts give you a read-only filesystem, so the JSON file backend cannot write.
//
// Requests live in a single Redis list. New ones are pushed onto the head, so
// reading the list back already gives newest-first without sorting.

import { Redis } from "@upstash/redis";
import type { ServiceRequest } from "@/lib/types";
import { toServiceRequests, type NewRequest, type RequestStore } from "./store";

const KEY = "fixit:requests";
const MAX_ITEMS = 500; // demo app: keep the list from growing forever

// Vercel's Upstash integration injects KV_REST_API_*; a standalone Upstash
// database gives you UPSTASH_REDIS_REST_*. Accept either.
function credentials() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isRedisConfigured(): boolean {
  return credentials() !== null;
}

let client: Redis | null = null;
function getClient(): Redis {
  if (!client) {
    const creds = credentials();
    if (!creds) throw new Error("Redis is not configured");
    client = new Redis(creds);
  }
  return client;
}

// The Upstash client parses JSON strings on read, so an entry can come back as
// either an object or a string depending on how it was written. Handle both.
function parseEntry(entry: unknown): ServiceRequest | null {
  try {
    const value = typeof entry === "string" ? JSON.parse(entry) : entry;
    if (!value || typeof value !== "object") return null;
    const rec = value as ServiceRequest;
    return rec.id && rec.text ? rec : null;
  } catch {
    return null;
  }
}

export const redisStore: RequestStore = {
  name: "redis",

  async list() {
    const raw = await getClient().lrange<unknown>(KEY, 0, MAX_ITEMS - 1);
    return raw.map(parseEntry).filter((r): r is ServiceRequest => r !== null);
  },

  async add(drafts: NewRequest[]) {
    const created = toServiceRequests(drafts);
    const redis = getClient();

    // Push newest first so the list reads back in the right order. The array is
    // reversed so that, within one batch, request 1 still ends up above request 2.
    await redis.lpush(KEY, ...[...created].reverse().map((r) => JSON.stringify(r)));
    await redis.ltrim(KEY, 0, MAX_ITEMS - 1);

    return created;
  },
};
