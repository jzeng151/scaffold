// Spec Forge — POST/GET /api/docs
//
// Stores project name + description in a durable KV store (Vercel KV in
// production, in-memory for development), returns a short ID.
// The ID is used in share URLs to look up the description.
// Selections are encoded in the URL query param, not stored here.

import { NextRequest, NextResponse } from "next/server";
import { saveDoc, getDoc } from "@/lib/doc-store";

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

    const id = await saveDoc(projectName, description ?? "");

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

  const entry = await getDoc(id);

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
