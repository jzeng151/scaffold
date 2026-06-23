"use client";

import type { DecisionNode } from "@/lib/types";
import type { WizardState } from "@/lib/wizard-state";

interface DecisionCardProps {
  node: DecisionNode;
  state: WizardState;
  onSelect: (nodeId: string, optionId: string) => void;
  onEscape: (nodeId: string) => void;
}

export function DecisionCard({ node, state, onSelect, onEscape }: DecisionCardProps) {
  const selectedOption = state.decisions[node.id];

  return (
    <div
      role="group"
      aria-label={node.question}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        padding: "var(--space-8)",
      }}
    >
      {/* Question */}
      <div>
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          {node.question}
        </h2>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {node.subtitle}
        </p>
      </div>

      {/* Options grid */}
      <div
        role="radiogroup"
        aria-label={node.question}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {node.options.map((option, index) => {
          const isSelected = selectedOption === option.id;
          // Roving tabindex: when nothing is selected, the first option
          // is tabbable so keyboard users can enter the radiogroup.
          const isTabbable = isSelected || (!selectedOption && index === 0);
          return (
            <button
              key={option.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isTabbable ? 0 : -1}
              className={`option-card${isSelected ? " selected" : ""}`}
              onClick={() => onSelect(node.id, option.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(node.id, option.id);
                }
              }}
            >
              <div className="option-checkmark" aria-hidden="true">
                ✓
              </div>
              <div className="option-label">{option.label}</div>
              <div className="option-explainer">{option.explainer}</div>
            </button>
          );
        })}
      </div>

      {/* Escape hatch */}
      <button
        onClick={() => onEscape(node.id)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-tertiary)",
          fontSize: "var(--text-sm)",
          cursor: "pointer",
          padding: "var(--space-2) 0",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-tertiary)";
        }}
      >
        {node.escape.explainer}
      </button>
    </div>
  );
}
