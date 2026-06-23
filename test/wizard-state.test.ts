// Critical-path tests: Wizard state reducer

import { describe, it, expect } from "vitest";
import { wizardReducer, initialState } from "@/lib/wizard-state";
import type { WizardAction } from "@/lib/wizard-state";

function dispatch(actions: WizardAction[]) {
  return actions.reduce(wizardReducer, { ...initialState });
}

describe("Wizard Reducer", () => {
  it("initial state has empty decisions and step 0", () => {
    expect(initialState.currentStepIndex).toBe(0);
    expect(initialState.decisions).toEqual({});
    expect(initialState.projectName).toBe("");
    expect(initialState.isComplete).toBe(false);
  });

  it("SET_PROJECT_NAME updates projectName", () => {
    const state = wizardReducer(initialState, {
      type: "SET_PROJECT_NAME",
      value: "My App",
    });
    expect(state.projectName).toBe("My App");
  });

  it("SELECT_OPTION stores the decision", () => {
    const state = wizardReducer(initialState, {
      type: "SELECT_OPTION",
      nodeId: "database",
      optionId: "postgresql",
    });
    expect(state.decisions.database).toBe("postgresql");
  });

  it("SELECT_OPTION preserves other decisions", () => {
    const s1 = wizardReducer(initialState, {
      type: "SELECT_OPTION",
      nodeId: "database",
      optionId: "postgresql",
    });
    const s2 = wizardReducer(s1, {
      type: "SELECT_OPTION",
      nodeId: "frontend",
      optionId: "nextjs",
    });
    expect(s2.decisions.database).toBe("postgresql");
    expect(s2.decisions.frontend).toBe("nextjs");
  });

  it("SELECT_ESCAPE uses the node's default option", () => {
    const state = wizardReducer(initialState, {
      type: "SELECT_ESCAPE",
      nodeId: "auth-strategy",
    });
    // auth-strategy escape default is oauth
    expect(state.decisions["auth-strategy"]).toBe("oauth");
  });

  it("NEXT advances from project-description to has-users", () => {
    const state = dispatch([
      { type: "SET_PROJECT_NAME", value: "Test" },
      { type: "NEXT" },
    ]);
    expect(state.currentStepIndex).toBe(1);
  });

  it("NEXT from has-users=yes goes to auth-strategy (linear)", () => {
    const state = dispatch([
      { type: "SET_PROJECT_NAME", value: "Test" },
      { type: "NEXT" },
      { type: "SELECT_OPTION", nodeId: "has-users", optionId: "yes" },
      { type: "NEXT" },
    ]);
    // Step 2 is auth-strategy
    expect(state.currentStepIndex).toBe(2);
  });

  it("NEXT from has-users=no skips auth-strategy (branch)", () => {
    const state = dispatch([
      { type: "SET_PROJECT_NAME", value: "Test" },
      { type: "NEXT" },
      { type: "SELECT_OPTION", nodeId: "has-users", optionId: "no" },
      { type: "NEXT" },
    ]);
    // Should skip step 2 (auth-strategy) and go to step 3 (database)
    expect(state.currentStepIndex).toBe(3);
  });

  it("BACK goes to previous step", () => {
    const state = dispatch([
      { type: "SET_PROJECT_NAME", value: "Test" },
      { type: "NEXT" },
      { type: "BACK" },
    ]);
    expect(state.currentStepIndex).toBe(0);
  });

  it("BACK from step 0 is a no-op", () => {
    const state = wizardReducer(initialState, { type: "BACK" });
    expect(state.currentStepIndex).toBe(0);
  });

  it("completing all steps sets isComplete", () => {
    const state = dispatch([
      { type: "SET_PROJECT_NAME", value: "Test" },
      { type: "NEXT" }, // → has-users
      { type: "SELECT_OPTION", nodeId: "has-users", optionId: "no" },
      { type: "NEXT" }, // → database (skipped auth)
      { type: "SELECT_OPTION", nodeId: "database", optionId: "postgresql" },
      { type: "NEXT" }, // → frontend
      { type: "SELECT_OPTION", nodeId: "frontend", optionId: "nextjs" },
      { type: "NEXT" }, // → backend
      { type: "SELECT_OPTION", nodeId: "backend", optionId: "serverless" },
      { type: "NEXT" }, // → deployment
      { type: "SELECT_OPTION", nodeId: "deployment", optionId: "vercel" },
      { type: "NEXT" }, // → api-design
      { type: "SELECT_OPTION", nodeId: "api-design", optionId: "rest" },
      { type: "NEXT" }, // → testing
      { type: "SELECT_OPTION", nodeId: "testing", optionId: "unit" },
      { type: "NEXT" }, // → end
    ]);
    expect(state.isComplete).toBe(true);
  });

  it("RESET returns to initial state", () => {
    const state = dispatch([
      { type: "SET_PROJECT_NAME", value: "Test" },
      { type: "NEXT" },
      { type: "RESET" },
    ]);
    expect(state).toEqual(initialState);
  });
});
