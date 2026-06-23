// Spec Forge — Decision Tree Configuration
//
// This IS the curriculum. Every node teaches one engineering concept through
// a guided choice. The explainers are the teaching mechanism — they let
// someone who's never heard the term make an informed choice.
//
// Voice: friendly senior dev pair-programming with you. Direct, warm,
// slightly opinionated. Never condescending.
//
// Explainer target: ≤40 words each.

import type { DecisionTree } from "./types";

export const decisionTree: DecisionTree = {
  steps: [
    // ──────────────────────────────────────────────────────────────
    // STEP 0: Project Description (free-text input, not a decision)
    // ──────────────────────────────────────────────────────────────
    {
      id: "project-description",
      type: "input",
      label: "What are you building?",
      placeholder: "e.g., A web app for tracking guitar practice progress",
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 1: Has User Accounts? (branching node — the only branch in v1)
    // ──────────────────────────────────────────────────────────────
    {
      id: "has-users",
      docSection: "User Accounts",
      question: "Do your users need to log in?",
      subtitle:
        "If people have accounts, you need auth, sessions, and user data. That's a whole layer of complexity. If not, you can skip it entirely and build faster.",
      options: [
        {
          id: "yes",
          label: "Yes, users have accounts",
          explainer:
            "People sign up, log in, and have their own data. Think Twitter, Notion, or any app where your stuff is different from someone else's stuff.",
        },
        {
          id: "no",
          label: "No, it's public or single-user",
          explainer:
            "Either everyone sees the same thing (like a blog), or there's only one user (like a personal tool). No login, no accounts, no sessions.",
        },
      ],
      escape: {
        defaultOptionId: "no",
        explainer:
          "Start without accounts. You can always add them later — it's easier to add auth than to remove it. Ship the core feature first.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 2: Auth Strategy (only shown if has-users = yes)
    // ──────────────────────────────────────────────────────────────
    {
      id: "auth-strategy",
      docSection: "Authentication",
      question: "How should users log in?",
      subtitle:
        "Auth is how you verify someone is who they claim. It's the front door to your app — and the most common place for security mistakes. Pick the simplest option that fits.",
      options: [
        {
          id: "jwt",
          label: "JWT (stateless tokens)",
          explainer:
            "After login, the server gives the browser a signed token. The browser sends it with each request. No server-side session storage needed. Works great with serverless and APIs.",
        },
        {
          id: "session",
          label: "Server sessions (cookies)",
          explainer:
            "After login, the server stores a session and sends a cookie. More traditional, well-understood. Easier to revoke access. Requires sticky sessions or a session store in production.",
        },
        {
          id: "oauth",
          label: "OAuth (Google / GitHub login)",
          explainer:
            "Let users log in with Google, GitHub, or another provider. You never store passwords. Fastest to implement with libraries like NextAuth. Best when you don't want to deal with credentials.",
        },
      ],
      escape: {
        defaultOptionId: "oauth",
        explainer:
          "Use OAuth (Google/GitHub login). It's the safest default — you never touch passwords, it's familiar to users, and libraries like NextAuth make it a 30-minute setup.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 3: Database Type
    // ──────────────────────────────────────────────────────────────
    {
      id: "database",
      docSection: "Data Model",
      question: "Where does your data live?",
      subtitle:
        "This determines how fast your app reads and writes, and how it scales when you get popular. Most web apps need a database — the question is what kind.",
      options: [
        {
          id: "postgresql",
          label: "SQL (PostgreSQL)",
          explainer:
            "A relational database. Think spreadsheets on steroids — data lives in tables with strict rules about what goes where. Best when your data has clear relationships (users have posts, posts have comments). Battle-tested, free, and every hosting provider supports it.",
        },
        {
          id: "mongodb",
          label: "NoSQL (MongoDB)",
          explainer:
            "A document database. Data lives in flexible JSON-like blobs instead of strict tables. Best when your data shape changes a lot or each record looks different. Popular with rapid-prototyping apps, but harder to query complex relationships.",
        },
        {
          id: "sqlite",
          label: "SQLite (embedded, file-based)",
          explainer:
            "A database that lives in a single file. No server to install, no configuration. Perfect for small apps, prototypes, and local development. Used by billions of devices. Upgrading to PostgreSQL later is straightforward.",
        },
        {
          id: "none",
          label: "No database (static / client-side only)",
          explainer:
            "Your app doesn't need to store data on a server. Maybe it's a calculator, a static landing page, or stores everything in the browser. Simplest possible setup — nothing to configure or pay for.",
        },
      ],
      escape: {
        defaultOptionId: "postgresql",
        explainer:
          "Go with PostgreSQL. It handles 90% of web apps well and you can always change later. If you want zero setup for prototyping, SQLite is the easiest starting point.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 4: Frontend Framework
    // ──────────────────────────────────────────────────────────────
    {
      id: "frontend",
      docSection: "Frontend",
      question: "What renders your user interface?",
      subtitle:
        "The frontend is what users see and click. The framework determines how you structure components, handle state, and route between pages. Pick the one with the best ecosystem for your needs.",
      options: [
        {
          id: "nextjs",
          label: "Next.js (React)",
          explainer:
            "The most popular React framework. Server-side rendering, file-based routing, API routes built in. If you're not sure, pick this — it has the largest community, the most tutorials, and deploys free on Vercel.",
        },
        {
          id: "vite-react",
          label: "Vite + React (SPA)",
          explainer:
            "A plain single-page app. No server rendering, no framework opinions — just React with Vite's fast dev server. Best when your app is fully client-side and you don't need SEO or server routes.",
        },
        {
          id: "sveltekit",
          label: "SvelteKit (Svelte)",
          explainer:
            "A compiler-based framework. Smaller bundles, less boilerplate, reactive by default. Best when you want maximum performance and are willing to learn something newer. Smaller ecosystem than React.",
        },
      ],
      escape: {
        defaultOptionId: "nextjs",
        explainer:
          "Pick Next.js. It's the safest bet — largest community, most tutorials, works everywhere. If you already know Svelte, SvelteKit is a strong alternative.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 5: Backend Architecture
    // ──────────────────────────────────────────────────────────────
    {
      id: "backend",
      docSection: "Backend Architecture",
      question: "Where does your server logic run?",
      subtitle:
        "The backend handles business logic, database queries, and authentication. The architecture you pick determines how you scale, how you deploy, and how complex your setup is.",
      options: [
        {
          id: "serverless",
          label: "Serverless (API routes / edge functions)",
          explainer:
            "Your backend code runs as functions that scale to zero when idle. No server to manage. Next.js API routes, Vercel Functions, Cloudflare Workers. Best for small-to-medium apps with bursty traffic. Cheapest at launch.",
        },
        {
          id: "monolith",
          label: "Monolith (traditional server)",
          explainer:
            "One server process handles everything — API, auth, database connections, background jobs. Simplest mental model. Best when you need WebSockets, long-running tasks, or heavy computation that doesn't fit serverless limits.",
        },
        {
          id: "static",
          label: "Static (no backend needed)",
          explainer:
            "Your app is fully static — no server logic, no API. Maybe it talks to a third-party service (Supabase, Firebase) directly from the browser. Cheapest, fastest, but limited to what client-side code can do.",
        },
      ],
      escape: {
        defaultOptionId: "serverless",
        explainer:
          "Go serverless. It's the cheapest to start, requires no server management, and scales automatically. If you later need WebSockets or long tasks, you can add a traditional server alongside it.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 6: Deployment Target
    // ──────────────────────────────────────────────────────────────
    {
      id: "deployment",
      docSection: "Deployment",
      question: "Where will you host this?",
      subtitle:
        "Deployment is how your app gets from your laptop to the internet. The right host depends on your framework, your database, and how much you want to configure yourself.",
      options: [
        {
          id: "vercel",
          label: "Vercel",
          explainer:
            "The company behind Next.js. Push to GitHub, it deploys automatically. Free tier is generous. Best for Next.js apps — zero configuration. Also supports other frameworks. Add-ons for databases and edge functions.",
        },
        {
          id: "cloudflare",
          label: "Cloudflare Pages / Workers",
          explainer:
            "Deploys to Cloudflare's global edge network. Extremely fast, generous free tier. Best for SvelteKit or static sites. Workers run serverless functions at the edge. Different runtime than Node.js — some libraries don't work.",
        },
        {
          id: "self-hosted",
          label: "Self-hosted (VPS / Docker)",
          explainer:
            "You rent a server (DigitalOcean, Hetzner, AWS EC2) and run everything yourself. Maximum control, lowest cost at scale, but you handle SSL, updates, monitoring, and backups yourself. Best when you need full control or have specific compliance requirements.",
        },
      ],
      escape: {
        defaultOptionId: "vercel",
        explainer:
          "Use Vercel. It's the easiest path — push to Git, it deploys. Free tier covers most side projects. You can always migrate to self-hosting later if costs grow.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 7: API Design
    // ──────────────────────────────────────────────────────────────
    {
      id: "api-design",
      docSection: "API Design",
      question: "How does your frontend talk to your backend?",
      subtitle:
        "The API is the contract between your frontend and backend. It defines how data flows. The style you pick affects how you structure routes, handle errors, and cache responses.",
      options: [
        {
          id: "rest",
          label: "REST (standard HTTP)",
          explainer:
            "The most common API style. URLs map to resources (/api/users, /api/posts), HTTP methods map to actions (GET, POST, PUT, DELETE). Everyone knows it, every tool supports it. Best default choice.",
        },
        {
          id: "rpc",
          label: "RPC / Server Actions",
          explainer:
            "Call server functions directly from the browser as if they were local. Next.js Server Actions and tRPC are examples. Less boilerplate than REST, type-safe end-to-end. Best when frontend and backend are the same codebase.",
        },
        {
          id: "graphql",
          label: "GraphQL",
          explainer:
            "The frontend asks for exactly the data it needs in a single query. No over-fetching, no under-fetching. Best for complex apps with many interrelated data types. Overkill for simple apps — adds complexity.",
        },
        {
          id: "none",
          label: "No API (static / client-side only)",
          explainer:
            "Your app doesn't need a custom API. Either there's no backend at all, or you use a managed service (Supabase, Firebase) that provides the API for you.",
        },
      ],
      escape: {
        defaultOptionId: "rest",
        explainer:
          "Use REST. It's the universal default — every tutorial, every tool, every framework supports it. If you're using Next.js, Server Actions are a valid alternative that saves boilerplate.",
      },
    },

    // ──────────────────────────────────────────────────────────────
    // STEP 8: Testing Approach
    // ──────────────────────────────────────────────────────────────
    {
      id: "testing",
      docSection: "Testing",
      question: "How will you verify your code works?",
      subtitle:
        "Testing is how you know your app does what you think it does. Without tests, every change is a gamble. You don't need 100% coverage — but you need something. Start small, add more as you grow.",
      options: [
        {
          id: "unit",
          label: "Unit tests (Vitest / Jest)",
          explainer:
            "Test individual functions in isolation. Fast, focused, catches logic bugs. The foundation of any test suite. Vitest is the modern choice for JS/TS projects — fast, zero-config, Jest-compatible.",
        },
        {
          id: "e2e",
          label: "End-to-end tests (Playwright)",
          explainer:
            "Test full user flows through a real browser — click buttons, fill forms, verify the page shows the right thing. Slower than unit tests, but catches integration bugs that unit tests miss.",
        },
        {
          id: "manual",
          label: "Manual testing only (for now)",
          explainer:
            "You test by using the app yourself. Every dev starts here. It's fine for a prototype, but it doesn't scale — you'll miss regressions as the app grows. Add automated tests before you have users.",
        },
      ],
      escape: {
        defaultOptionId: "unit",
        explainer:
          "Start with unit tests using Vitest. They're fast, easy to write, and catch the most bugs for the least effort. Add Playwright E2E tests for critical user flows (signup, payment) later.",
      },
    },
  ],

  // ──────────────────────────────────────────────────────────────
  // BRANCHING RULES
  //
  // The tree is linear by default (step N+1 follows step N).
  // The only branch in v1: if has-users = no, skip auth-strategy.
  // ──────────────────────────────────────────────────────────────
  branches: [
    {
      // If the user says "no accounts", skip the auth strategy question
      // and jump directly to the database question.
      nodeId: "has-users",
      optionId: "no",
      nextNodeId: "database",
    },
    // Default (no branch match): has-users=yes → auth-strategy → database
    // is handled by the linear step order.
  ],
};
