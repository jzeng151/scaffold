// Spec Forge — POST /api/docs
//
// Stores project name + description in Vercel KV, returns a short ID.
// The ID is used in share URLs to look up the description.
// Selections are encoded in the URL query param, not stored here.

import { NextRequest, NextResponse } from "next/server";

// In-memory store for development (no KV configured).
// In production, this is replaced by Vercel KV.
const docStore = new Map<string, { projectName: string; description: string; createdAt: number }>();

// Clean up old entries every hour (dev only)
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, value] of docStore.entries()) {
    if (now - value.createdAt > MAX_AGE_MS) {
      docStore.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, description } = body;

    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json(
        { error: "projectName is required" },
        { status: 400 },
      );
    }

    // Generate a short ID (8 chars, URL-safe)
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    docStore.set(id, {
      projectName: projectName.slice(0, 200),
      description: (description ?? "").slice(0, 5000),
      createdAt: Date.now(),
    });

    // Periodic cleanup
    if (docStore.size > 100) {
      cleanupOldEntries();
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id parameter is required" },
      { status: 400 },
    );
  }

  const entry = docStore.get(id);

  if (!entry) {
    return NextResponse.json(
      { error: "Document not found. This link may have expired." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    projectName: entry.projectName,
    description: entry.description,
  });
}
