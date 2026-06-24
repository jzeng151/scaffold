// Spec Forge — SDD Document Generator
//
// Maps wizard decisions to the Software Design Document (SDD) template structure.
// Each wizard decision contributes to one or more SDD sections.
// Sections without decisions remain as ghost placeholders.
//
// SDD template: https://gist.github.com/iamhenry/2dbabd0d59051eae360d8cfa6a2782bd

import { decisionTree } from "./decision-tree";
import type { WizardState } from "./wizard-state";
import type { DecisionNode } from "./types";

// ─── Types ──────────────────────────────────────────────────────────────

export interface SddSection {
  id: string;
  number: string;
  title: string;
  /** "populated" = has content, "ghost" = placeholder, "partial" = some subsections filled */
  status: "populated" | "ghost" | "partial";
  subsections: SddSubsection[];
}

export interface SddSubsection {
  label: string;
  /** The content text, or null if ghost */
  content: string | null;
  /** Whether this subsection is derived from a wizard decision */
  fromDecision?: string;
  /** True when the driving decision was set via the "not sure yet" escape
   *  hatch. Lets the rendered doc distinguish a recommended default from an
   *  explicit user choice so uncertain decisions aren't overstated. */
  isEscape?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getOption(nodeId: string, decisions: Record<string, string>) {
  const node = decisionTree.steps.find(
    (s): s is DecisionNode => s.id === nodeId && "options" in s,
  );
  if (!node) return null;
  const optionId = decisions[nodeId];
  if (!optionId) return null;
  return node.options.find((o) => o.id === optionId) ?? null;
}

function hasDecision(nodeId: string, decisions: Record<string, string>) {
  return decisions[nodeId] !== undefined;
}

// ─── Section generators ────────────────────────────────────────────────

function generateIntroduction(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "Purpose",
    content: state.projectDescription
      ? state.projectDescription
      : null,
  });

  subsections.push({
    label: "Scope",
    content: state.projectName
      ? `This document defines the architecture and design of ${state.projectName}.`
      : null,
  });

  subsections.push({
    label: "Definitions and Acronyms",
    content: hasDecision("database", state.decisions)
      ? "See the Technology Stack section for definitions of all chosen technologies."
      : null,
  });

  subsections.push({
    label: "References",
    content: null, // Ghost — user adds their own references
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "introduction",
    number: "1",
    title: "Introduction",
    status,
    subsections,
  };
}

function generateSystemOverview(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "System Description",
    content: state.projectDescription || null,
  });

  // Design goals — derived from decisions
  const goals: string[] = [];
  if (hasDecision("backend", state.decisions)) {
    const backend = state.decisions.backend;
    if (backend === "serverless") goals.push("Automatic scaling (serverless)");
    if (backend === "monolith") goals.push("Operational simplicity (monolith)");
    if (backend === "static") goals.push("Maximum performance (static)");
  }
  subsections.push({
    label: "Design Goals",
    content: goals.length > 0 ? goals.join(", ") : null,
    fromDecision: "backend",
  });

  // Architecture summary
  let archSummary: string | null = null;
  if (hasDecision("backend", state.decisions) && hasDecision("frontend", state.decisions)) {
    const frontend = getOption("frontend", state.decisions);
    const backend = getOption("backend", state.decisions);
    archSummary = `${frontend?.label ?? "Web frontend"} with ${backend?.label ?? "serverless backend"}.`;
  }
  subsections.push({
    label: "Architecture Summary",
    content: archSummary,
    fromDecision: "frontend",
  });

  subsections.push({
    label: "System Context Diagram",
    content: hasDecision("frontend", state.decisions)
      ? "See the Architecture Diagram section for the system context."
      : null,
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "system-overview",
    number: "2",
    title: "System Overview",
    status,
    subsections,
  };
}

function generateArchitecturalDesign(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "System Architecture Diagram",
    content: hasDecision("frontend", state.decisions)
      ? "Generated from your tech stack decisions. See the architecture diagram above."
      : null,
  });

  // Component breakdown — derived from choices
  const components: string[] = [];
  if (hasDecision("has-users", state.decisions)) {
    if (state.decisions["has-users"] === "yes") {
      components.push("**Authentication**: User login and session management");
    }
  }
  if (hasDecision("database", state.decisions) && state.decisions.database !== "none") {
    const db = getOption("database", state.decisions);
    components.push(`**Data Layer**: ${db?.label} for persistent storage`);
  }
  if (hasDecision("backend", state.decisions) && state.decisions.backend !== "static") {
    const backend = getOption("backend", state.decisions);
    components.push(`**Backend**: ${backend?.label} for business logic and API`);
  }
  if (hasDecision("frontend", state.decisions)) {
    const frontend = getOption("frontend", state.decisions);
    components.push(`**Frontend**: ${frontend?.label} for the user interface`);
  }

  subsections.push({
    label: "Component Breakdown",
    content: components.length > 0
      ? components.map((c) => `- ${c}`).join("\n")
      : null,
    fromDecision: "frontend",
  });

  // Technology stack
  const stack: string[] = [];
  for (const nodeId of ["frontend", "backend", "database", "deployment", "api-design", "testing"]) {
    const opt = getOption(nodeId, state.decisions);
    if (opt) stack.push(`- **${nodeId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}**: ${opt.label}`);
  }
  subsections.push({
    label: "Technology Stack",
    content: stack.length > 0 ? stack.join("\n") : null,
  });

  subsections.push({
    label: "Data Flow and Control Flow",
    content: hasDecision("api-design", state.decisions)
      ? state.decisions["api-design"] === "none"
        ? "No API — the app is static / client-side only. All assets are bundled at build time or fetched directly from third-party services in the browser. There is no backend or database layer in the request path."
        : (hasDecision("database", state.decisions) && state.decisions.database !== "none")
          ? `Communication pattern: ${getOption("api-design", state.decisions)?.label}. Frontend sends requests to the backend, which queries the database and returns responses.`
          : `Communication pattern: ${getOption("api-design", state.decisions)?.label}. Frontend sends requests to the backend, which applies business logic and returns responses. There is no persistent database — state is in-memory, cached, or served from external services.`
      : null,
    fromDecision: "api-design",
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "architectural-design",
    number: "3",
    title: "Architectural Design",
    status,
    subsections,
  };
}

function generateDatabaseDesign(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];
  const hasDb = hasDecision("database", state.decisions) && state.decisions.database !== "none";

  subsections.push({
    label: "ER Diagram / Schema Diagram",
    content: hasDb
      ? `Primary database: ${getOption("database", state.decisions)?.label}. Define your core entities (e.g., User, Post, Comment) and their relationships in a schema diagram.`
      : null,
    fromDecision: "database",
  });

  // Auto-generate suggested tables based on decisions
  const tables: string[] = [];
  if (hasDb) {
    if (state.decisions["has-users"] === "yes") {
      tables.push("- **users**: id, email, name, created_at, updated_at");
    }
    tables.push("- **[your_core_entity]**: id, name, description, created_at, updated_at");
    if (state.decisions["has-users"] === "yes") {
      tables.push("- **[entity]_user**: user_id, entity_id, role (junction table for user relationships)");
    }
  }

  subsections.push({
    label: "Tables/Collections",
    content: tables.length > 0
      ? `Suggested starting schema:\n${tables.join("\n")}\n\n*Customize these for your specific domain.*`
      : null,
    fromDecision: "database",
  });

  subsections.push({
    label: "Relationships",
    content: hasDb && state.decisions["has-users"] === "yes"
      ? "Users own their data (one-to-many: user → entities). Consider whether entities are shared between users (many-to-many) or private."
      : hasDb
        ? "Define relationships between your core entities based on your domain."
        : null,
    fromDecision: "database",
  });

  subsections.push({
    label: "Migration Strategy",
    content: hasDb
      ? "Use a migration tool (e.g., Prisma Migrate, Drizzle Kit, or raw SQL migrations) to version-control schema changes. Never edit the production schema directly."
      : null,
    fromDecision: "database",
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "database-design",
    number: "5",
    title: "Database Design",
    status,
    subsections,
  };
}

function generateExternalInterfaces(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "User Interface",
    content: hasDecision("frontend", state.decisions)
      ? `Frontend: ${getOption("frontend", state.decisions)?.label}. The UI renders in the browser with responsive design for mobile and desktop.`
      : null,
    fromDecision: "frontend",
  });

  subsections.push({
    label: "External APIs",
    content: state.decisions["has-users"] === "yes" &&
      state.decisions["auth-strategy"] === "oauth"
      ? "OAuth provider API (Google/GitHub) for authentication. Additional third-party APIs as needed for your domain."
      : null,
    fromDecision: "auth-strategy",
  });

  subsections.push({
    label: "Network Protocols/Communication",
    content: hasDecision("api-design", state.decisions)
      ? state.decisions["api-design"] === "none"
        ? "No client-server communication protocol — the app is static / client-side only. Third-party services are called directly from the browser via HTTPS."
        : `${getOption("api-design", state.decisions)?.label} for client-server communication.`
      : null,
    fromDecision: "api-design",
  });

  subsections.push({
    label: "Hardware Interfaces",
    content: null, // Ghost — rarely relevant for web apps
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "external-interfaces",
    number: "6",
    title: "External Interfaces",
    status,
    subsections,
  };
}

function generateSecurity(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "Authentication",
    content: (state.decisions["has-users"] !== "no" && hasDecision("auth-strategy", state.decisions))
      ? `${getOption("auth-strategy", state.decisions)?.label}. ${getOption("auth-strategy", state.decisions)?.explainer}`
      : state.decisions["has-users"] === "no"
        ? "No authentication required — the app is public or single-user."
        : null,
    fromDecision: "auth-strategy",
  });

  subsections.push({
    label: "Authorization",
    content: state.decisions["has-users"] === "yes"
      ? "Implement role-based access control (RBAC) if users have different permission levels. At minimum, users can only access their own data."
      : null,
    fromDecision: "has-users",
  });

  subsections.push({
    label: "Data Protection",
    content: hasDecision("deployment", state.decisions)
      ? state.decisions["has-users"] === "no"
        ? "Use HTTPS everywhere (enforced by your hosting provider). Use environment variables for secrets."
        : "Use HTTPS everywhere (enforced by your hosting provider). Hash passwords with bcrypt or argon2. Never store plaintext credentials. Use environment variables for secrets."
      : null,
  });

  subsections.push({
    label: "Compliance",
    content: null, // Ghost — depends on jurisdiction/domain
  });

  subsections.push({
    label: "Threat Model",
    content: (state.decisions["has-users"] !== "no" && hasDecision("auth-strategy", state.decisions))
      ? "Primary threats: credential theft (mitigated by OAuth/hashing), session hijacking (mitigated by secure cookies/JWT expiry), injection attacks (mitigated by parameterized queries)."
      : state.decisions["has-users"] === "no"
        ? "Primary threats: cross-site scripting (XSS) mitigated by input sanitization and a strong CSP, supply-chain risk from third-party scripts, and misconfigured cache headers exposing stale data."
        : null,
    fromDecision: "auth-strategy",
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "security",
    number: "7",
    title: "Security Considerations",
    status,
    subsections,
  };
}

function generatePerformance(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "Expected Load",
    content: null, // Ghost — user fills in
  });

  subsections.push({
    label: "Caching Strategy",
    content: hasDecision("backend", state.decisions)
      ? state.decisions.backend === "serverless"
        ? "Leverage edge caching via your CDN (Vercel/Cloudflare). Cache static assets indefinitely. Consider Redis for server-side caching of expensive queries."
        : state.decisions.backend === "static"
          ? "Pre-render and cache all pages at build time. Serve via a CDN with long-lived, immutable cache headers and content-hash-based filenames. No server-side cache layer is needed."
          : "Implement server-side caching with Redis or in-memory cache. Cache database query results and computed aggregations."
      : null,
    fromDecision: "backend",
  });

  subsections.push({
    label: "Database Optimization",
    content: hasDecision("database", state.decisions) && state.decisions.database !== "none"
      ? state.decisions.database === "postgresql"
        ? "Add indexes on frequently queried columns (foreign keys, search fields). Use connection pooling (PgBouncer for PostgreSQL). Monitor slow queries."
        : state.decisions.database === "mongodb"
          ? "Create indexes on frequently queried fields. Use the MongoDB query profiler to identify slow queries. Consider read replicas for read-heavy workloads. Use connection pooling via the driver."
          : "Add indexes on frequently queried columns (SQLite uses partial and expression indexes). For concurrent access, enable WAL mode. Monitor slow queries with EXPLAIN QUERY PLAN."
      : null,
    fromDecision: "database",
  });

  subsections.push({
    label: "Scaling Strategy",
    content: hasDecision("backend", state.decisions)
      ? state.decisions.backend === "serverless"
        ? "Serverless scales horizontally and automatically. Monitor cold start times. Database will likely be the bottleneck before compute."
        : state.decisions.backend === "static"
          ? "Static hosting scales to effectively unlimited traffic through CDN edge caching — there is no compute layer to scale, only bandwidth and cache hit rates to monitor."
          : "Scale vertically first (bigger server), then horizontally (load balancer + multiple instances). Use a managed database with read replicas for read-heavy workloads."
      : null,
    fromDecision: "backend",
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "performance",
    number: "8",
    title: "Performance and Scalability",
    status,
    subsections,
  };
}

function generateDeployment(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "Environments",
    content: hasDecision("deployment", state.decisions)
      ? "Three environments: local (development), preview (branch deploys for review), production (live)."
      : null,
    fromDecision: "deployment",
  });

  subsections.push({
    label: "CI/CD Pipeline",
    content: hasDecision("deployment", state.decisions)
      ? state.decisions.deployment === "vercel"
        ? "Vercel handles CI/CD automatically: push to main → build → deploy to production. Preview deploys for every branch. Run tests before merge."
        : "Set up GitHub Actions: lint → test → build → deploy. Use environment secrets for production credentials. Deploy on merge to main."
      : null,
    fromDecision: "deployment",
  });

  subsections.push({
    label: "Cloud/Hosting",
    content: hasDecision("deployment", state.decisions)
      ? `${getOption("deployment", state.decisions)?.label}. ${getOption("deployment", state.decisions)?.explainer ?? ""}`
      : null,
    fromDecision: "deployment",
  });

  subsections.push({
    label: "Containerization/Orchestration",
    content: hasDecision("deployment", state.decisions)
      ? state.decisions.deployment === "self-hosted"
        ? "Use Docker for containerization. Consider Docker Compose for multi-service setups. Kubernetes if scaling beyond a single server."
        : "Not required — your hosting provider handles the infrastructure layer."
      : null,
    fromDecision: "deployment",
  });

  subsections.push({
    label: "Infrastructure Diagram",
    content: hasDecision("deployment", state.decisions)
      ? "See the Architecture Diagram section for the deployment topology."
      : null,
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "deployment",
    number: "9",
    title: "Deployment Architecture",
    status,
    subsections,
  };
}

function generateTesting(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "Unit Testing",
    content: hasDecision("testing", state.decisions)
      ? state.decisions.testing === "manual"
        ? "Not in scope — the user opted for manual testing only at this stage. Add unit tests as the project matures."
        : state.decisions.testing === "unit"
          ? `${getOption("testing", state.decisions)?.label}. Target: 70%+ coverage on business logic and utility functions. Run on every commit.`
          : "Add unit tests for critical business logic. Target: 70%+ coverage on core functions."
      : null,
    fromDecision: "testing",
  });

  subsections.push({
    label: "Integration Testing",
    content: hasDecision("testing", state.decisions)
      ? state.decisions.testing === "manual"
        ? "Not in scope — the user opted for manual testing only at this stage."
        : "Test API endpoints and database queries against a test database. Verify request/response cycles work end-to-end."
      : null,
  });

  subsections.push({
    label: "End-to-End Testing",
    content: hasDecision("testing", state.decisions)
      ? state.decisions.testing === "manual"
        ? "Not in scope — the user opted for manual testing only at this stage."
        : state.decisions.testing === "e2e"
          ? `${getOption("testing", state.decisions)?.label}. Cover critical user flows: signup, login, core action, logout. Run against a staging environment.`
          : "Add Playwright E2E tests for critical user flows (signup, payment, core action). Run before each deploy."
      : null,
    fromDecision: "testing",
  });

  subsections.push({
    label: "Quality Metrics",
    content: hasDecision("testing", state.decisions)
      ? "Track: test coverage %, linting passes, type-check passes, build success rate. Block merges on failing tests."
      : null,
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : populatedCount < subsections.length ? "partial" : "populated";

  return {
    id: "testing",
    number: "10",
    title: "Testing Strategy",
    status,
    subsections,
  };
}

function generateAppendices(state: WizardState): SddSection {
  const subsections: SddSubsection[] = [];

  subsections.push({
    label: "Diagrams",
    content: "See architecture diagram in the System Overview section.",
  });

  subsections.push({
    label: "Glossary",
    content: null, // Ghost
  });

  subsections.push({
    label: "Change History",
    content: state.projectName
      ? `- v1.0 | ${new Date().toISOString().split("T")[0]} | Initial design doc generated by Spec Forge`
      : null,
  });

  const populatedCount = subsections.filter((s) => s.content !== null).length;
  const status = populatedCount === 0 ? "ghost" : "partial";

  return {
    id: "appendices",
    number: "11",
    title: "Appendices",
    status,
    subsections,
  };
}

// ─── Main generator ────────────────────────────────────────────────────

export function generateSdd(state: WizardState): SddSection[] {
  const sections = [
    generateIntroduction(state),
    generateSystemOverview(state),
    generateArchitecturalDesign(state),
    // Section 4 (Detailed Design) is intentionally omitted for v1 —
    // it requires per-component detail that the wizard doesn't capture.
    // The user adds it manually after the wizard generates the foundation.
    generateDatabaseDesign(state),
    generateExternalInterfaces(state),
    generateSecurity(state),
    generatePerformance(state),
    generateDeployment(state),
    generateTesting(state),
    generateAppendices(state),
  ];

  // Mark subsections driven by an escape-hatch ("don't know yet") decision so
  // the rendered doc can show them as recommended defaults rather than
  // explicit choices. This prevents the SDD from overstating uncertain
  // decisions the user deferred to the wizard's default option.
  const escapeSet = new Set(state.escapeDecisions ?? []);
  for (const section of sections) {
    for (const sub of section.subsections) {
      if (sub.fromDecision && escapeSet.has(sub.fromDecision)) {
        sub.isEscape = true;
      }
    }
  }

  return sections;
}
