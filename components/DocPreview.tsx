"use client";

import { decisionTree } from "@/lib/decision-tree";
import type { WizardState } from "@/lib/wizard-state";
import { isDecisionNode } from "@/lib/types";
import { generateSdd } from "@/lib/doc-generator";
import type { SddSection } from "@/lib/doc-generator";

interface DocPreviewProps {
  state: WizardState;
  /** Whether to show the "section entered" animation on the latest addition */
  latestNodeId?: string | null;
}

export function DocPreview({ state, latestNodeId }: DocPreviewProps) {
  const sections = generateSdd(state);
  const hasAnyContent = state.projectName || Object.keys(state.decisions).length > 0;

  return (
    <div className="doc-content" style={{ padding: "var(--space-8)" }}>
      {/* ─── Project header ─────────────────────────────────── */}
      {state.projectName ? (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-2)" }}>
            Software Design Document
          </p>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--text-primary)" }}>
            {state.projectName}
          </h1>
          {state.projectDescription && (
            <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
              {state.projectDescription}
            </p>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-2)" }}>
            Software Design Document
          </p>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--text-tertiary)" }}>
            Untitled Project
          </h1>
        </div>
      )}

      {/* ─── Architecture diagram ───────────────────────────── */}
      {hasAnyContent && (
        <SddSectionView
          section={sections[1]} // System Overview contains the diagram reference
          latestNodeId={latestNodeId}
          state={state}
          showDiagram
        />
      )}

      {/* ─── SDD Sections ───────────────────────────────────── */}
      {sections.map((section) => (
        <SddSectionView
          key={section.id}
          section={section}
          latestNodeId={latestNodeId}
          state={state}
        />
      ))}
    </div>
  );
}

// ─── Section renderer ──────────────────────────────────────────────────

interface SddSectionViewProps {
  section: SddSection;
  latestNodeId?: string | null;
  state: WizardState;
  showDiagram?: boolean;
}

function SddSectionView({ section, latestNodeId, state, showDiagram }: SddSectionViewProps) {
  // Check if this section just got populated (for the animation)
  const isLatest = section.subsections.some(
    (sub) => sub.fromDecision && sub.fromDecision === latestNodeId,
  );

  // Skip auth-related sections if user said no accounts
  const skipSection =
    (section.id === "security" && state.decisions["has-users"] === "no") ||
    false;

  if (skipSection) return null;

  if (section.status === "ghost") {
    return (
      <div className="doc-section-ghost" key={section.id}>
        <h3 style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", fontWeight: 500 }}>
          {section.number}. {section.title}
        </h3>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: "var(--space-1)" }}>
          Make decisions to populate this section
        </p>
      </div>
    );
  }

  return (
    <div
      className={`doc-section${isLatest ? " doc-section-enter" : ""}`}
      style={{
        padding: "var(--space-4) 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "var(--space-3)",
        }}
      >
        {section.number}. {section.title}
      </h3>

      {showDiagram && (
        <ArchitectureDiagramInline state={state} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {section.subsections.map((sub) => (
          <div key={sub.label}>
            {sub.content !== null ? (
              <>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {sub.label}
                </p>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {sub.content}
                </div>
              </>
            ) : (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  fontStyle: "italic",
                }}
              >
                {sub.label}: —
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inline architecture diagram (rendered in System Overview) ─────────

function ArchitectureDiagramInline({ state }: { state: WizardState }) {
  // Lazy import to avoid circular deps
  const { ArchitectureDiagram } = require("@/components/ArchitectureDiagram");
  const { generateDiagramData } = require("@/lib/architecture-diagram-data");

  const diagramData = generateDiagramData(state.decisions);
  if (diagramData.boxes.length === 0) return null;

  return (
    <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
      <ArchitectureDiagram data={diagramData} />
    </div>
  );
}
