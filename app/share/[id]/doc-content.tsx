import { DocPreview } from "@/components/DocPreview";
import { decodeState } from "@/lib/url-state";
import type { WizardState } from "@/lib/wizard-state";
import Link from "next/link";

interface SharedDocContentProps {
  id: string;
  selectionsParam?: string;
}

type FetchResult =
  | { status: "success"; projectName: string; description: string }
  | { status: "not_found" }
  | { status: "error" }
  | { status: "partial"; projectName: string; description: string; missingDecisions: boolean };

async function fetchDoc(id: string): Promise<FetchResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/docs?id=${id}`,
      { cache: "no-store" },
    );

    if (res.status === 404) {
      return { status: "not_found" };
    }

    if (!res.ok) {
      return { status: "error" };
    }

    const data = await res.json();
    return {
      status: "success",
      projectName: data.projectName,
      description: data.description ?? "",
    };
  } catch {
    return { status: "error" };
  }
}

export async function SharedDocContent({
  id,
  selectionsParam,
}: SharedDocContentProps) {
  // Decode selections from URL (available immediately)
  let decisions: Record<string, string> = {};
  let selectionsValid = true;

  if (selectionsParam) {
    const decoded = decodeState(selectionsParam);
    if (decoded) {
      decisions = decoded.decisions;
    } else {
      selectionsValid = false;
    }
  }

  // Fetch description from KV store
  const result = await fetchDoc(id);

  // ─── Error states ──────────────────────────────────────────

  if (result.status === "not_found") {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            marginBottom: "var(--space-4)",
          }}
        >
          This design doc link has expired or was removed
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>
          The share link is no longer valid. Ask the creator to generate a new one.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "var(--space-2) var(--space-6)",
            background: "var(--accent)",
            borderRadius: "var(--radius-md)",
            color: "var(--bg-base)",
            fontWeight: 600,
          }}
        >
          Create your own design doc →
        </Link>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            marginBottom: "var(--space-4)",
          }}
        >
          We&apos;re having trouble loading this doc right now
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>
          The server might be temporarily unavailable. Try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "var(--space-2) var(--space-6)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!selectionsValid) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            marginBottom: "var(--space-4)",
          }}
        >
          Some decisions in this link couldn&apos;t be loaded
        </h2>
        <p style={{ color: "var(--text-secondary)" }}>
          The share link may be incomplete or corrupted.
        </p>
      </div>
    );
  }

  // ─── Success — render the doc ──────────────────────────────

  const wizardState: WizardState = {
    currentStepIndex: 0,
    projectName: result.status === "success" ? result.projectName : "",
    projectDescription: result.status === "success" ? result.description : "",
    decisions,
    isComplete: true,
  };

  return <DocPreview state={wizardState} />;
}
