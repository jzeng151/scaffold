// Spec Forge — Shared Document Store
//
// Uses Vercel KV (Upstash Redis) when KV_REST_API_URL is configured.
// Falls back to an in-memory Map for local development.
//
// Shared between the API route (POST/GET) and the server component
// (app/share/[id]/doc-content.tsx) so the shared-doc page reads from the
// data layer directly — no self-referential HTTP fetch.

import { kv } from "@vercel/kv";

export interface DocEntry {
  projectName: string;
  description: string;
  createdAt: number;
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hasKV = !!process.env.KV_REST_API_URL;

// ── Dev-only in-memory store ──────────────────────────────────────────────

const memoryStore = new Map<string, DocEntry>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now - value.createdAt > MAX_AGE_MS) {
      memoryStore.delete(key);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────

function generateId(): string {
  // 8 hex chars from a UUID — collision retry keeps it safe at scale.
  let id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  // Guard against the astronomically unlikely collision so we never
  // silently overwrite an existing doc.
  // (hasSync check is dev-only; KV path retries in saveDoc below.)
  while (memoryStore.has(id)) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  }
  return id;
}

export async function saveDoc(
  projectName: string,
  description: string,
): Promise<string> {
  if (hasKV) {
    // Generate ID and retry on collision (KV doesn't have a sync .has())
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const existing = await kv.get(id);
      if (existing === null) {
        await kv.set(id, {
          projectName: projectName.slice(0, 200),
          description: (description ?? "").slice(0, 5000),
          createdAt: Date.now(),
        });
        return id;
      }
    }
    // Exhausted retries — fall through to a fresh ID (still unique enough)
    const fallbackId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    await kv.set(fallbackId, {
      projectName: projectName.slice(0, 200),
      description: (description ?? "").slice(0, 5000),
      createdAt: Date.now(),
    });
    return fallbackId;
  }

  // Dev: in-memory store
  const id = generateId();
  memoryStore.set(id, {
    projectName: projectName.slice(0, 200),
    description: (description ?? "").slice(0, 5000),
    createdAt: Date.now(),
  });

  if (memoryStore.size > 100) {
    cleanupMemoryStore();
  }

  return id;
}

export async function getDoc(id: string): Promise<DocEntry | null> {
  if (hasKV) {
    const entry = (await kv.get<DocEntry>(id));
    if (entry === null) return null;

    // Expire old entries
    if (Date.now() - entry.createdAt > MAX_AGE_MS) {
      await kv.del(id);
      return null;
    }
    return entry;
  }

  const entry = memoryStore.get(id);
  if (!entry) return null;

  if (Date.now() - entry.createdAt > MAX_AGE_MS) {
    memoryStore.delete(id);
    return null;
  }
  return entry;
}
