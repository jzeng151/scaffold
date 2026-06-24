// Spec Forge — Decision Tree Validator
//
// Runs at build time (npm run validate-tree) to catch broken branching logic
// BEFORE it reaches production. A broken decision path is a silent failure —
// the wizard shows a blank screen and the user bounces.
//
// Checks:
//   1. No dead ends — every path leads to a real next node or the end
//   2. No loops — following next steps never revisits a node
//   3. No orphan nodes — every node is reachable from step 0
//   4. Every option has required fields (id, label, explainer)
//   5. Every escape default points to a real option
//   6. Every branch target exists and its source option exists
//
// Usage: npm run validate-tree
// Exit: 0 = valid, 1 = invalid (prints errors)

import { decisionTree } from "./decision-tree";
import type { DecisionNode, WizardStep } from "./types";

interface ValidationError {
  node: string;
  message: string;
}

const errors: ValidationError[] = [];

function error(node: string, message: string) {
  errors.push({ node, message });
}

// ─── Check 1-3: Walk every possible path through the tree ───────────────

function getNextStepId(
  currentStepId: string,
  selectedOptionId: string | null,
): string | null {
  const steps = decisionTree.steps;
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  if (currentIndex === -1) return null;
  if (currentIndex >= steps.length - 1) return null; // End of tree

  // Check branching rules first
  if (selectedOptionId) {
    for (const branch of decisionTree.branches) {
      if (
        branch.nodeId === currentStepId &&
        branch.optionId === selectedOptionId
      ) {
        return branch.nextNodeId;
      }
    }
  }

  // Default: linear next step
  return steps[currentIndex + 1].id;
}

function validatePaths() {
  const steps = decisionTree.steps;

  for (const startStep of steps) {
    // For decision nodes, walk every option + escape
    if (startStep.id === "project-description") {
      // Input step — only one path (linear next)
      const visited = new Set<string>();
      let currentId: string | null = startStep.id;
      const nextId = getNextStepId(startStep.id, null);

      if (nextId) {
        // Check the linear path from project-description
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId);
          const currentStep = steps.find((s) => s.id === currentId);

          if (currentStep && "options" in currentStep) {
            // Walk first option of each decision node
            currentId = getNextStepId(currentId, currentStep.options[0]?.id ?? null);
          } else {
            currentId = getNextStepId(currentId, null);
          }
        }
        if (currentId && visited.has(currentId)) {
          error(startStep.id, `Loop detected: path revisits node "${currentId}"`);
        }
      }
    }

    if ("options" in startStep) {
      // Walk every option path
      for (const option of startStep.options) {
        const visited = new Set<string>();
        let currentId: string | null = getNextStepId(startStep.id, option.id);

        while (currentId && !visited.has(currentId)) {
          visited.add(currentId);
          const currentStep = steps.find((s) => s.id === currentId);

          if (currentStep && "options" in currentStep) {
            currentId = getNextStepId(currentId, currentStep.options[0]?.id ?? null);
          } else {
            currentId = getNextStepId(currentId, null);
          }
        }

        if (currentId && visited.has(currentId)) {
          error(
            startStep.id,
            `Loop detected from option "${option.id}": revisits "${currentId}"`,
          );
        }
      }

      // Also check escape default path
      const escapeNext = getNextStepId(startStep.id, "__escape__");
      // Escape doesn't change branching, so it follows the same path as
      // the default option. Just verify the default option exists.
      const escapeDefault = startStep.escape.defaultOptionId;
      if (!startStep.options.find((o) => o.id === escapeDefault)) {
        error(
          startStep.id,
          `Escape default "${escapeDefault}" doesn't match any option`,
        );
      }
    }
  }
}

// ─── Check 4: Every option has required fields ──────────────────────────

function validateOptionFields() {
  for (const step of decisionTree.steps) {
    if (!("options" in step)) continue;

    for (const option of step.options) {
      if (!option.id || option.id.length === 0) {
        error(step.id, "Option missing id");
      }
      if (!option.label || option.label.length === 0) {
        error(step.id, `Option "${option.id}" missing label`);
      }
      if (!option.explainer || option.explainer.length === 0) {
        error(step.id, `Option "${option.id}" missing explainer`);
      }
      // Check explainer word count (target: ≤40 words, warn if over)
      const wordCount = option.explainer.split(/\s+/).length;
      if (wordCount > 50) {
        error(
          step.id,
          `Option "${option.id}" explainer is ${wordCount} words (target: ≤40). Trim it.`,
        );
      }
    }

    // Check escape fields
    if (!step.escape.defaultOptionId) {
      error(step.id, "Escape missing defaultOptionId");
    }
    if (!step.escape.explainer || step.escape.explainer.length === 0) {
      error(step.id, "Escape missing explainer");
    }
  }
}

// ─── Check 5: Escape defaults point to real options ─────────────────────

function validateEscapeDefaults() {
  for (const step of decisionTree.steps) {
    if (!("options" in step)) continue;

    const optionIds = step.options.map((o) => o.id);
    if (!optionIds.includes(step.escape.defaultOptionId)) {
      error(
        step.id,
        `Escape default "${step.escape.defaultOptionId}" not in options [${optionIds.join(", ")}]`,
      );
    }
  }
}

// ─── Check 6: Branch targets and sources exist ──────────────────────────

function validateBranches() {
  const allStepIds = decisionTree.steps.map((s) => s.id);

  for (const branch of decisionTree.branches) {
    // Source node exists
    if (!allStepIds.includes(branch.nodeId)) {
      error("branch", `Branch source "${branch.nodeId}" not found in steps`);
      continue;
    }

    // Source node has the specified option
    const sourceStep = decisionTree.steps.find(
      (s): s is DecisionNode =>
        s.id === branch.nodeId && "options" in s,
    );

    if (sourceStep) {
      const optionExists = sourceStep.options.some(
        (o) => o.id === branch.optionId,
      );
      if (!optionExists) {
        error(
          branch.nodeId,
          `Branch references option "${branch.optionId}" which doesn't exist`,
        );
      }
    }

    // Target node exists
    if (!allStepIds.includes(branch.nextNodeId)) {
      error(
        branch.nodeId,
        `Branch target "${branch.nextNodeId}" not found in steps`,
      );
    }
  }
}

// ─── Check: No duplicate node IDs ───────────────────────────────────────

function validateUniqueIds() {
  const ids = decisionTree.steps.map((s) => s.id);
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      error(id, `Duplicate step ID "${id}"`);
    }
    seen.add(id);
  }
}

// ─── Check: Every node reachable from step 0 ────────────────────────────

function validateReachability() {
  const reachable = new Set<string>();
  const queue: string[] = [decisionTree.steps[0].id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (reachable.has(currentId)) continue;
    reachable.add(currentId);

    const step = decisionTree.steps.find((s) => s.id === currentId);
    if (!step) continue;

    if ("options" in step) {
      // Add all option targets
      for (const option of step.options) {
        const next = getNextStepId(currentId, option.id);
        if (next && !reachable.has(next)) queue.push(next);
      }
    }

    // Add linear next
    const linearNext = getNextStepId(currentId, null);
    if (linearNext && !reachable.has(linearNext)) queue.push(linearNext);
  }

  for (const step of decisionTree.steps) {
    if (!reachable.has(step.id)) {
      error(step.id, `Node "${step.id}" is unreachable from step 0`);
    }
  }
}

// ─── Run all checks ─────────────────────────────────────────────────────

validateUniqueIds();
validateOptionFields();
validateEscapeDefaults();
validateBranches();
validatePaths();
validateReachability();

// ─── Report ─────────────────────────────────────────────────────────────

if (errors.length === 0) {
  const nodeCount = decisionTree.steps.filter((s) => "options" in s).length;
  const branchCount = decisionTree.branches.length;
  const optionCount = decisionTree.steps
    .filter((s) => "options" in s)
    .reduce((sum, s) => sum + (s as DecisionNode).options.length, 0);

  console.log("✓ Decision tree is valid");
  console.log(`  Steps: ${decisionTree.steps.length} (1 input + ${nodeCount} decisions)`);
  console.log(`  Options: ${optionCount}`);
  console.log(`  Branches: ${branchCount}`);
  process.exit(0);
} else {
  console.error(`✗ Decision tree has ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  [${err.node}] ${err.message}`);
  }
  console.error("");
  process.exit(1);
}
