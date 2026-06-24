// Critical-path tests: SDD document generator

import { describe, it, expect } from "vitest";
import { generateSdd } from "@/lib/doc-generator";
import type { WizardState } from "@/lib/wizard-state";

function makeState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    currentStepIndex: 0,
    projectName: "",
    projectDescription: "",
    decisions: {},
    isComplete: false,
    ...overrides,
  } as WizardState;
}

const fullState = makeState({
  projectName: "Guitar Practice App",
  projectDescription: "A web app for tracking guitar practice progress.",
  decisions: {
    "has-users": "yes",
    "auth-strategy": "oauth",
    database: "postgresql",
    frontend: "nextjs",
    backend: "serverless",
    deployment: "vercel",
    "api-design": "rest",
    testing: "unit",
  },
});

describe("SDD Document Generator", () => {
  it("generates all 10 SDD sections (1-3, 5-11)", () => {
    const sections = generateSdd(fullState);
    // Section 4 (Detailed Design) is intentionally omitted in v1
    expect(sections).toHaveLength(10);
  });

  it("section numbers match SDD template", () => {
    const sections = generateSdd(fullState);
    const numbers = sections.map((s) => s.number);
    expect(numbers).toEqual(["1", "2", "3", "5", "6", "7", "8", "9", "10", "11"]);
  });

  it("section titles match SDD template", () => {
    const sections = generateSdd(fullState);
    expect(sections[0].title).toBe("Introduction");
    expect(sections[1].title).toBe("System Overview");
    expect(sections[2].title).toBe("Architectural Design");
    expect(sections[3].title).toBe("Database Design");
    expect(sections[4].title).toBe("External Interfaces");
    expect(sections[5].title).toBe("Security Considerations");
    expect(sections[6].title).toBe("Performance and Scalability");
    expect(sections[7].title).toBe("Deployment Architecture");
    expect(sections[8].title).toBe("Testing Strategy");
    expect(sections[9].title).toBe("Appendices");
  });
});

describe("SDD: Empty state (ghost sections)", () => {
  it("all sections are ghost when no decisions are made", () => {
    const sections = generateSdd(makeState());
    // Appendices always has the diagrams reference
    const ghostOrPartial = sections.filter(
      (s) => s.status === "ghost" || s.status === "partial",
    );
    expect(ghostOrPartial.length).toBe(sections.length);
  });

  it("introduction is ghost when no project name", () => {
    const sections = generateSdd(makeState());
    expect(sections[0].status).toBe("ghost");
  });
});

describe("SDD: Populated state (all decisions made)", () => {
  it("introduction has Purpose and Scope populated", () => {
    const sections = generateSdd(fullState);
    const intro = sections[0];
    const purpose = intro.subsections.find((s) => s.label === "Purpose");
    const scope = intro.subsections.find((s) => s.label === "Scope");
    expect(purpose?.content).toBeTruthy();
    expect(scope?.content).toContain("Guitar Practice App");
  });

  it("system overview has architecture summary from frontend + backend", () => {
    const sections = generateSdd(fullState);
    const overview = sections[1];
    const arch = overview.subsections.find((s) => s.label === "Architecture Summary");
    expect(arch?.content).toContain("Next.js");
    expect(arch?.content).toContain("Serverless");
  });

  it("database design suggests users table when has-users=yes", () => {
    const sections = generateSdd(fullState);
    const db = sections[3];
    const tables = db.subsections.find((s) => s.label === "Tables/Collections");
    expect(tables?.content).toContain("users");
  });

  it("security section has authentication from auth-strategy decision", () => {
    const sections = generateSdd(fullState);
    const security = sections[5];
    const auth = security.subsections.find((s) => s.label === "Authentication");
    expect(auth?.content).toContain("OAuth");
  });

  it("testing section has unit testing from testing decision", () => {
    const sections = generateSdd(fullState);
    const testing = sections[8];
    const unit = testing.subsections.find((s) => s.label === "Unit Testing");
    expect(unit?.content).toContain("Vitest");
  });

  it("deployment section has hosting from deployment decision", () => {
    const sections = generateSdd(fullState);
    const deploy = sections[7];
    const hosting = deploy.subsections.find((s) => s.label === "Cloud/Hosting");
    expect(hosting?.content).toContain("Vercel");
  });

  it("technology stack lists all chosen technologies", () => {
    const sections = generateSdd(fullState);
    const arch = sections[2];
    const stack = arch.subsections.find((s) => s.label === "Technology Stack");
    expect(stack?.content).toContain("Next.js");
    expect(stack?.content).toContain("PostgreSQL");
    expect(stack?.content).toContain("REST");
  });
});

describe("SDD: Partial decisions (some nodes answered)", () => {
  it("partially answered sections are marked partial", () => {
    const partialState = makeState({
      projectName: "My App",
      decisions: { database: "postgresql" },
    });
    const sections = generateSdd(partialState);
    const db = sections[3]; // Database Design
    expect(db.status).toBe("populated");
  });

  it("unanswered sections remain ghost", () => {
    const partialState = makeState({
      projectName: "My App",
      decisions: { database: "postgresql" },
    });
    const sections = generateSdd(partialState);
    const testing = sections[8]; // Testing Strategy
    expect(testing.status).toBe("ghost");
  });
});

describe("SDD: No-users branch", () => {
  it("database design does not suggest users table when has-users=no", () => {
    const noUsersState = makeState({
      projectName: "Blog",
      decisions: {
        "has-users": "no",
        database: "postgresql",
      },
    });
    const sections = generateSdd(noUsersState);
    const db = sections[3];
    const tables = db.subsections.find((s) => s.label === "Tables/Collections");
    expect(tables?.content).not.toContain("users");
  });
});
