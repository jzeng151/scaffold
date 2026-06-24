// Spec Forge — og:image Edge Function
//
// Generates a social preview card (PNG) for shared design docs.
// When someone pastes a share link in Discord/X/Slack, this endpoint
// renders a card with the project name, tech stack, and mini diagram.
//
// Route: GET /api/og?id=<docId>&s=<base64-selections>
//
// Uses next/og (Vercel OG) — runs on the Edge runtime.

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const s = searchParams.get("s");

  if (!id || !s) {
    // Fallback: generic Spec Forge card
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#0a0a0a",
            color: "#fafafa",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700 }}>Spec Forge</div>
          <div style={{ fontSize: 24, color: "#a1a1aa", marginTop: 12 }}>
            Design your project before you build it
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  // Decode selections from URL
  let projectName = "Untitled Project";
  let stackLabels: string[] = [];

  try {
    // Decode base64 selections
    const padded = s.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf-8");
    const decisions = JSON.parse(json);

    // Map decisions to short labels
    const stackMap: Record<string, Record<string, string>> = {
      "auth-strategy": {
        jwt: "JWT",
        session: "Sessions",
        oauth: "OAuth",
      },
      database: {
        postgresql: "PostgreSQL",
        mongodb: "MongoDB",
        sqlite: "SQLite",
      },
      frontend: {
        nextjs: "Next.js",
        "vite-react": "Vite",
        sveltekit: "SvelteKit",
      },
      backend: {
        serverless: "Serverless",
        monolith: "Monolith",
        static: "Static",
      },
      deployment: {
        vercel: "Vercel",
        cloudflare: "Cloudflare",
        "self-hosted": "Self-hosted",
      },
      "api-design": {
        rest: "REST",
        rpc: "Server Actions",
        graphql: "GraphQL",
      },
      testing: {
        unit: "Unit Tests",
        e2e: "E2E Tests",
        manual: "Manual",
      },
    };

    for (const [nodeId, optionId] of Object.entries(decisions) as [string, string][]) {
      const label = stackMap[nodeId]?.[optionId];
      if (label) stackLabels.push(label);
    }
  } catch {
    // If decoding fails, show generic card
  }

  // Fetch project name from KV store
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/docs?id=${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.projectName) projectName = data.projectName;
    }
  } catch {
    // Name fetch failed — use fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Spec Forge label */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: "#22c55e",
              borderRadius: 999,
              marginRight: 12,
            }}
          />
          <div style={{ fontSize: 20, color: "#71717a", fontWeight: 600 }}>
            Spec Forge
          </div>
        </div>

        {/* Project name */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#fafafa",
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          {projectName}
        </div>

        {/* Tech stack badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: "auto" }}>
          {stackLabels.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "8px 20px",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 8,
                fontSize: 22,
                color: "#a1a1aa",
                fontFamily: "monospace",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
