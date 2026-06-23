import { DocPreview } from "@/components/DocPreview";
import { decodeState } from "@/lib/url-state";
import { getDoc } from "@/lib/doc-store";
import { decisionTree } from "@/lib/decision-tree";
import type { WizardState } from "@/lib/wizard-state";
import type { DecisionNode } from "@/lib/types";
import Link from "next/link";

interface SharedDocContentProps {
  id: string;
  selectionsParam?: string;
}

type FetchResult =
  | { status: "success"; projectName: string; description: string }
  | { status: "not_found" }
  | { status: "error" };

async function fetchDoc(id: string): Promise<FetchResult> {
  try {
    const entry = await getDoc(id);

    if (!entry) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      projectName: entry.projectName,
      description: entry.description ?? "",
    };
  } catch {
    return { status: "error" };
  }
}

/**
 * Validate decoded selections against the known decision tree.
 * Returns false if any node ID or option ID is unrecognized.
 */
function validateDecisions(decisions: Record<string, string>): boolean {
  const decisionNodes = decisionTree.steps.filter(
    (s): s is DecisionNode => "options" in s,
  );

  for (const [nodeId, optionId] of Object.entries(decisions)) {
    const node = decisionNodes.find((n) => n.id === nodeId);
    if (!node) return false;
    if (!node.options.some((o) => o.id === optionId)) return false;
  }

  return true;
}

export async function SharedDocContent({
  id,
  selectionsParam,
}: SharedDocContentProps) {
  // Decode selections from URL (available immediately)
  let decisions: Record<string, string> = {};
  let selectionsValid = true;
  let decoded: ReturnType<typeof decodeState> = null;

  if (selectionsParam) {
    decoded = decodeState(selectionsParam);
    if (decoded && validateDecisions(decoded.decisions)) {
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
        <a
          href={`/share/${id}${selectionsParam ? `?s=${selectionsParam}` : ""}`}
          style={{
            display: "inline-block",
            padding: "var(--space-2) var(--space-6)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Try Again
        </a>
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
    projectName: result.projectName,
    projectDescription: result.description,
    decisions,
    escapeDecisions: decoded?.escapeDecisions ?? [],
    isComplete: true,
  };

  return <DocPreview state={wizardState} />;
}
