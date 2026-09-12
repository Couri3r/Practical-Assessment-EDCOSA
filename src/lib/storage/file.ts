// JSON file backend. Used for local development.
//
// Chosen over SQLite because it needs no native dependency and no schema, and
// over an in-memory array because it survives a dev-server restart. It does NOT
// work on a serverless host, where the filesystem is read-only - that is what
// the Redis backend is for.

import { promises as fs } from "fs";
import path from "path";
import type { ServiceRequest } from "@/lib/types";
import { newestFirst, toServiceRequests, type NewRequest, type RequestStore } from "./store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");

// Writes are chained on this promise so two concurrent saves cannot interleave
// and corrupt the file.
let writeQueue: Promise<void> = Promise.resolve();

async function readAll(): Promise<ServiceRequest[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ServiceRequest[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return []; // first run
    throw err;
  }
}

export const fileStore: RequestStore = {
  name: "json-file",

  async list() {
    return newestFirst(await readAll());
  },

  async add(drafts: NewRequest[]) {
    const created = toServiceRequests(drafts);

    const task = writeQueue.then(async () => {
      const existing = await readAll();
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify([...existing, ...created], null, 2), "utf8");
    });
    writeQueue = task.catch(() => undefined); // keep the queue alive after a failure
    await task;

    return created;
  },
};
