"use client";

import { decisionTree } from "@/lib/decision-tree";
import type { WizardState } from "@/lib/wizard-state";
import { isDecisionNode, isProjectDescription } from "@/lib/types";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { generateDiagramData } from "@/lib/architecture-diagram-data";

interface DocPreviewProps {
  state: WizardState;
  /** Whether to show the "section entered" animation on the latest addition */
  latestNodeId?: string | null;
}

export function DocPreview({ state, latestNodeId }: DocPreviewProps) {
  const decisionSteps = decisionTree.steps.filter(isDecisionNode);

  return (
    <div
      className="doc-content"
      style={{
        padding: "var(--space-8)",
      }}
    >
      {/* Project header */}
      {state.projectName ? (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h1
            style={{
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {state.projectName}
          </h1>
          {state.projectDescription && (
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--text-secondary)",
                marginTop: "var(--space-2)",
              }}
            >
              {state.projectDescription}
            </p>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h1
            style={{
              fontSize: "var(--text-3xl)",
              fontWeight: 700,
              color: "var(--text-tertiary)",
            }}
          >
            Untitled Project
          </h1>
        </div>
      )}

      {/* Decision sections */}
      {decisionSteps.map((step) => {
        const selection = state.decisions[step.id];
        const isPopulated = selection !== undefined;
        const isLatest = latestNodeId === step.id;
        const isGhost = !isPopulated;

        // Skip auth section if user said no accounts
        if (step.id === "auth-strategy" && state.decisions["has-users"] === "no") {
          return null;
        }

        if (isGhost) {
          return (
            <div key={step.id} className="doc-section-ghost">
              <h3>{step.docSection}</h3>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                }}
              >
                Make a decision to populate this section
              </p>
            </div>
          );
        }

        const option = step.options.find((o) => o.id === selection);
        const isEscape = state.escapeDecisions?.includes(step.id) ?? false;

        return (
          <div
            key={step.id}
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
                marginBottom: "var(--space-2)",
              }}
            >
              {step.docSection}
            </h3>
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              {option?.label}
            </p>
            {option && !isEscape && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  marginTop: "var(--space-1)",
                }}
              >
                {option.explainer}
              </p>
            )}
            {isEscape && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                  fontStyle: "italic",
                }}
              >
                Default: {option?.label}
              </p>
            )}
          </div>
        );
      })}

      {/* Architecture diagram — rendered when at least one decision is made */}
      {Object.keys(state.decisions).length > 0 && (
        <div style={{ marginTop: "var(--space-8)" }}>
          <h3
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "var(--space-4)",
            }}
          >
            Architecture
          </h3>
          <ArchitectureDiagram data={generateDiagramData(state.decisions)} />
        </div>
      )}
    </div>
  );
}
