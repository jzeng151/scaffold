// Spec Forge — Wizard State Management
//
// useReducer-based state for the wizard. Flat, type-safe, zero dependencies.
// The reducer is a pure function — easy to unit test in isolation.

"use client";

import { useReducer, useCallback, useMemo } from "react";
import { decisionTree } from "./decision-tree";
import type { WizardStep } from "./types";

// ─── State Types ────────────────────────────────────────────────────────

export interface WizardState {
  /** Index into decisionTree.steps for the current step */
  currentStepIndex: number;
  /** Project name (from the input step) */
  projectName: string;
  /** Project description (from the input step) */
  projectDescription: string;
  /** Map of decision node ID → selected option ID */
  decisions: Record<string, string>;
  /** Whether the wizard is complete (all decisions made) */
  isComplete: boolean;
}

export const initialState: WizardState = {
  currentStepIndex: 0,
  projectName: "",
  projectDescription: "",
  decisions: {},
  isComplete: false,
};

// ─── Actions ────────────────────────────────────────────────────────────

export type WizardAction =
  | { type: "SET_PROJECT_NAME"; value: string }
  | { type: "SET_PROJECT_DESCRIPTION"; value: string }
  | { type: "SELECT_OPTION"; nodeId: string; optionId: string }
  | { type: "SELECT_ESCAPE"; nodeId: string }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "GO_TO"; stepIndex: number }
  | { type: "RESET" };

// ─── Helper: resolve the next step index considering branches ───────────

function resolveNextStepId(
  currentNodeId: string,
  selectedOptionId: string | null,
): string | null {
  const steps = decisionTree.steps;
  const currentIndex = steps.findIndex((s) => s.id === currentNodeId);

  if (currentIndex === -1 || currentIndex >= steps.length - 1) return null;

  // Check branching rules first
  if (selectedOptionId) {
    for (const branch of decisionTree.branches) {
      if (
        branch.nodeId === currentNodeId &&
        branch.optionId === selectedOptionId
      ) {
        const targetIndex = steps.findIndex((s) => s.id === branch.nextNodeId);
        if (targetIndex !== -1) return branch.nextNodeId;
      }
    }
  }

  // Default: linear next step
  return steps[currentIndex + 1].id;
}

function stepIdToIndex(stepId: string): number {
  return decisionTree.steps.findIndex((s) => s.id === stepId);
}

// ─── Reducer ────────────────────────────────────────────────────────────

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_PROJECT_NAME":
      return { ...state, projectName: action.value };

    case "SET_PROJECT_DESCRIPTION":
      return { ...state, projectDescription: action.value };

    case "SELECT_OPTION":
      return {
        ...state,
        decisions: { ...state.decisions, [action.nodeId]: action.optionId },
      };

    case "SELECT_ESCAPE": {
      // Find the node's escape default and use it as the selection
      const step = decisionTree.steps.find(
        (s) => s.id === action.nodeId && "options" in s,
      );
      if (step && "options" in step) {
        return {
          ...state,
          decisions: {
            ...state.decisions,
            [action.nodeId]: step.escape.defaultOptionId,
          },
        };
      }
      return state;
    }

    case "NEXT": {
      const steps = decisionTree.steps;
      const currentStep = steps[state.currentStepIndex];

      if (!currentStep) return state;

      // For decision nodes, use the selected option to resolve branches
      let selectedOption: string | null = null;
      if ("options" in currentStep) {
        selectedOption = state.decisions[currentStep.id] ?? null;
      }

      const nextStepId = resolveNextStepId(currentStep.id, selectedOption);

      if (!nextStepId) {
        // End of tree
        return { ...state, isComplete: true };
      }

      const nextIndex = stepIdToIndex(nextStepId);
      if (nextIndex === -1) return state;

      return { ...state, currentStepIndex: nextIndex };
    }

    case "BACK": {
      if (state.currentStepIndex === 0) return state;

      // Walk backwards, skipping steps that were branched around
      // For v1 with one branch, simple index decrement works because
      // BACK should retrace the user's actual path. We store the path
      // implicitly via step indices — if the user went A→C (skipping B),
      // BACK from C goes to A, not B.
      //
      // Simplest correct approach: decrement and let the caller
      // validate whether the step is relevant.
      const prevIndex = state.currentStepIndex - 1;

      // Check if the previous step should have been skipped
      const prevStep = decisionTree.steps[prevIndex];
      if (prevStep && "options" in prevStep === false) {
        // It's the project description input — always valid to go back to
        return { ...state, currentStepIndex: prevIndex };
      }

      // Check if prev step was auth-strategy and user said no users
      if (prevStep && prevStep.id === "auth-strategy") {
        const hasUsers = state.decisions["has-users"];
        if (hasUsers === "no") {
          // Skip auth-strategy, go to has-users
          const hasUsersIndex = stepIdToIndex("has-users");
          return { ...state, currentStepIndex: hasUsersIndex };
        }
      }

      return { ...state, currentStepIndex: prevIndex };
    }

    case "GO_TO":
      return { ...state, currentStepIndex: action.stepIndex };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────

export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const currentStep: WizardStep = useMemo(
    () => decisionTree.steps[state.currentStepIndex],
    [state.currentStepIndex],
  );

  const progress = useMemo(() => {
    const total = decisionTree.steps.length;
    const current = state.currentStepIndex + 1;
    return { current, total, percent: (current / total) * 100 };
  }, [state.currentStepIndex]);

  const canGoBack = state.currentStepIndex > 0;

  const canGoForward = useMemo(() => {
    if (currentStep.id === "project-description") {
      return state.projectName.trim().length > 0;
    }
    if ("options" in currentStep) {
      return state.decisions[currentStep.id] !== undefined;
    }
    return false;
  }, [currentStep, state.projectName, state.decisions]);

  const setProjectName = useCallback(
    (value: string) => dispatch({ type: "SET_PROJECT_NAME", value }),
    [],
  );

  const setProjectDescription = useCallback(
    (value: string) => dispatch({ type: "SET_PROJECT_DESCRIPTION", value }),
    [],
  );

  const selectOption = useCallback(
    (nodeId: string, optionId: string) =>
      dispatch({ type: "SELECT_OPTION", nodeId, optionId }),
    [],
  );

  const selectEscape = useCallback(
    (nodeId: string) => dispatch({ type: "SELECT_ESCAPE", nodeId }),
    [],
  );

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    currentStep,
    progress,
    canGoBack,
    canGoForward,
    setProjectName,
    setProjectDescription,
    selectOption,
    selectEscape,
    next,
    back,
    reset,
  };
}
