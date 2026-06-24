// Critical-path tests: Decision tree validation
//
// These tests verify the decision tree structure is sound and the
// branching logic resolves correctly.

import { describe, it, expect } from "vitest";
import { decisionTree } from "@/lib/decision-tree";
import { isDecisionNode, isProjectDescription } from "@/lib/types";

describe("Decision Tree Structure", () => {
  it("has 9 steps total (1 input + 8 decisions)", () => {
    expect(decisionTree.steps).toHaveLength(9);
  });

  it("starts with project-description input step", () => {
    expect(isProjectDescription(decisionTree.steps[0])).toBe(true);
    expect(decisionTree.steps[0].id).toBe("project-description");
  });

  it("every step after the first is a decision node", () => {
    for (let i = 1; i < decisionTree.steps.length; i++) {
      expect(isDecisionNode(decisionTree.steps[i])).toBe(true);
    }
  });

  it("has exactly 8 decision nodes", () => {
    const decisions = decisionTree.steps.filter(isDecisionNode);
    expect(decisions).toHaveLength(8);
  });
});

describe("Decision Tree: Node Schema", () => {
  const decisionNodes = decisionTree.steps.filter(isDecisionNode);

  it("every decision node has a unique id", () => {
    const ids = decisionNodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every decision node has question, subtitle, and docSection", () => {
    for (const node of decisionNodes) {
      expect(node.question).toBeTruthy();
      expect(node.question.length).toBeGreaterThan(5);
      expect(node.subtitle).toBeTruthy();
      expect(node.docSection).toBeTruthy();
    }
  });

  it("every decision node has 2-4 options", () => {
    for (const node of decisionNodes) {
      expect(node.options.length).toBeGreaterThanOrEqual(2);
      expect(node.options.length).toBeLessThanOrEqual(4);
    }
  });

  it("every option has id, label, and explainer", () => {
    for (const node of decisionNodes) {
      for (const option of node.options) {
        expect(option.id).toBeTruthy();
        expect(option.label).toBeTruthy();
        expect(option.explainer).toBeTruthy();
        expect(option.explainer.length).toBeGreaterThan(20);
      }
    }
  });

  it("explainers are ≤50 words (target 40, allow 50)", () => {
    for (const node of decisionNodes) {
      for (const option of node.options) {
        const wordCount = option.explainer.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(50);
      }
    }
  });
});

describe("Decision Tree: Escape Hatches", () => {
  const decisionNodes = decisionTree.steps.filter(isDecisionNode);

  it("every decision node has an escape with defaultOptionId", () => {
    for (const node of decisionNodes) {
      expect(node.escape).toBeDefined();
      expect(node.escape.defaultOptionId).toBeTruthy();
      expect(node.escape.explainer).toBeTruthy();
    }
  });

  it("every escape default points to a real option", () => {
    for (const node of decisionNodes) {
      const optionIds = node.options.map((o) => o.id);
      expect(optionIds).toContain(node.escape.defaultOptionId);
    }
  });
});

describe("Decision Tree: Branching Logic", () => {
  it("has exactly 1 branch rule in v1", () => {
    expect(decisionTree.branches).toHaveLength(1);
  });

  it("branch: has-users=no skips to database", () => {
    const branch = decisionTree.branches[0];
    expect(branch.nodeId).toBe("has-users");
    expect(branch.optionId).toBe("no");
    expect(branch.nextNodeId).toBe("database");
  });

  it("branch source node exists in steps", () => {
    const branch = decisionTree.branches[0];
    const nodeIds = decisionTree.steps.map((s) => s.id);
    expect(nodeIds).toContain(branch.nodeId);
  });

  it("branch target node exists in steps", () => {
    const branch = decisionTree.branches[0];
    const nodeIds = decisionTree.steps.map((s) => s.id);
    expect(nodeIds).toContain(branch.nextNodeId);
  });

  it("branch source option exists on source node", () => {
    const branch = decisionTree.branches[0];
    const node = decisionTree.steps.find(
      (s) => s.id === branch.nodeId && isDecisionNode(s),
    );
    expect(node).toBeDefined();
    if (node && isDecisionNode(node)) {
      const optionIds = node.options.map((o) => o.id);
      expect(optionIds).toContain(branch.optionId);
    }
  });
});
