// Spec Forge — Decision Tree Types
//
// The decision tree IS the curriculum. Every node teaches one engineering
// concept through a guided choice. The schema below defines the shape each
// node follows. See the design doc for the full rationale.
//
// Schema:
//   question  — the prompt text (conversational, opinionated voice)
//   subtitle  — why this matters, in plain English (≤40 words)
//   options[] — 3-4 selectable choices, each with a label and explainer
//   escape    — "don't know yet" option with a sensible default
//
// Every node MUST have an escape hatch. These decisions are reversible.

/** A single selectable option in a decision node. */
export interface DecisionOption {
  /** Short label shown on the card (e.g., "SQL (PostgreSQL)") */
  id: string;
  label: string;
  /** Plain-English explainer, ≤40 words. Teaches the concept through the choice. */
  explainer: string;
}

/** The "don't know yet" escape hatch. Always has a sensible default. */
export interface EscapeOption {
  /** What we default to if the user picks this (e.g., "postgresql") */
  defaultOptionId: string;
  /** Reassuring copy — tells the user this is fine and reversible */
  explainer: string;
}

/** A decision node in the wizard tree. */
export interface DecisionNode {
  /** Unique identifier (e.g., "database", "auth-strategy") */
  id: string;
  /** The section heading this decision generates in the output doc */
  docSection: string;
  /** The question prompt — conversational, slightly opinionated */
  question: string;
  /** Why this decision matters, in plain English (≤40 words) */
  subtitle: string;
  /** 3-4 selectable options */
  options: DecisionOption[];
  /** "Don't know yet" escape hatch with a default */
  escape: EscapeOption;
}

/** The project description input step (free text, not a decision node). */
export interface ProjectDescriptionStep {
  id: "project-description";
  type: "input";
  label: string;
  placeholder: string;
}

/** A node in the wizard flow — either a decision or the project description input. */
export type WizardStep = ProjectDescriptionStep | DecisionNode;

/** Type guard: is this step a decision node? */
export function isDecisionNode(step: WizardStep): step is DecisionNode {
  return (step as DecisionNode).options !== undefined;
}

/** Type guard: is this step the project description input? */
export function isProjectDescription(step: WizardStep): step is ProjectDescriptionStep {
  return step.id === "project-description";
}

/**
 * Branching rule: given a node ID and the selected option ID, return the next
 * node ID. If no branch matches, fall through to `default`.
 */
export interface BranchRule {
  /** The node whose selection triggers this branch */
  nodeId: string;
  /** The option ID that triggers this branch */
  optionId: string;
  /** The next node to show */
  nextNodeId: string;
}

/** The complete decision tree configuration. */
export interface DecisionTree {
  /** Ordered list of steps in the wizard (project description first, then decisions) */
  steps: WizardStep[];
  /** Branching rules — override the linear next-step order */
  branches: BranchRule[];
}
