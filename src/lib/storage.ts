// Persistence. The brief allows an in-memory array, a JSON file, or SQLite.
// A JSON file was chosen: it survives server restarts (unlike memory) and needs
// no native dependency or schema setup (unlike SQLite). Swapping to a real
// database later means re-implementing these two functions only.

import { promises as fs } from "fs";
import path from "path";
import type { ServiceRequest } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");

// Writes are chained on this promise so two concurrent saves cannot
// interleave and corrupt the file.
let writeQueue: Promise<void> = Promise.resolve();

async function readAll(): Promise<ServiceRequest[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ServiceRequest[]) : [];
  } catch (err) {
    // First run: no file yet.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(items: ServiceRequest[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

/** All saved requests, newest first. */
export async function listRequests(): Promise<ServiceRequest[]> {
  const items = await readAll();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Save one or more confirmed requests. Returns the saved records with ids and timestamps. */
export async function addRequests(
  drafts: Array<Pick<ServiceRequest, "text" | "category" | "priority">>,
): Promise<ServiceRequest[]> {
  const now = new Date().toISOString();
  const created: ServiceRequest[] = drafts.map((d) => ({
    id: crypto.randomUUID(),
    text: d.text,
    category: d.category,
    priority: d.priority,
    createdAt: now,
  }));

  const task = writeQueue.then(async () => {
    const existing = await readAll();
    await writeAll([...existing, ...created]);
  });
  writeQueue = task.catch(() => undefined); // keep the queue alive after a failure
  await task;

  return created;
}
