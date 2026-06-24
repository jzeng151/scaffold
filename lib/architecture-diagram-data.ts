// Spec Forge — Architecture Diagram Data
//
// Converts wizard decisions into box-and-arrow data for the SVG renderer.
// Read-only, deterministic, zero dependencies.

export interface DiagramBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramArrow {
  from: string;
  to: string;
}

export interface DiagramData {
  boxes: DiagramBox[];
  arrows: DiagramArrow[];
}

const BOX_WIDTH = 130;
const BOX_HEIGHT = 56;
const GAP = 24;

/**
 * Generate architecture diagram data from wizard decisions.
 * Layout: vertical stack (frontend → backend → database) with optional auth/deploy boxes.
 */
export function generateDiagramData(decisions: Record<string, string>): DiagramData {
  const boxes: DiagramBox[] = [];
  const arrows: DiagramArrow[] = [];
  let y = 0;

  // Deployment (top, if selected)
  if (decisions.deployment) {
    const labels: Record<string, string> = {
      vercel: "Vercel",
      cloudflare: "Cloudflare",
      "self-hosted": "Self-hosted",
    };
    boxes.push({
      id: "deploy",
      label: labels[decisions.deployment] ?? "Hosting",
      x: 0,
      y,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
    });
    y += BOX_HEIGHT + GAP;
  }

  // Frontend
  if (decisions.frontend) {
    const labels: Record<string, string> = {
      nextjs: "Next.js",
      "vite-react": "Vite + React",
      sveltekit: "SvelteKit",
    };
    boxes.push({
      id: "frontend",
      label: labels[decisions.frontend] ?? "Frontend",
      x: 0,
      y,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
    });
    y += BOX_HEIGHT + GAP;
  }

  // API (between frontend and backend)
  if (decisions["api-design"]) {
    const labels: Record<string, string | null> = {
      rest: "REST API",
      rpc: "Server Actions",
      graphql: "GraphQL",
      none: null,
    };
    const apiLabel = labels[decisions["api-design"]];
    if (apiLabel) {
      boxes.push({
        id: "api",
        label: apiLabel,
        x: 0,
        y,
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
      });
      if (boxes.length > 1) {
        arrows.push({ from: boxes[boxes.length - 2].id, to: "api" });
      }
      y += BOX_HEIGHT + GAP;
    }
  }

  // Backend
  if (decisions.backend) {
    const labels: Record<string, string> = {
      serverless: "Serverless",
      monolith: "Server",
      static: "Static",
    };
    boxes.push({
      id: "backend",
      label: labels[decisions.backend] ?? "Backend",
      x: 0,
      y,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
    });
    if (boxes.length > 1) {
      const prevId = boxes[boxes.length - 2].id;
      if (prevId !== "api") {
        arrows.push({ from: prevId, to: "backend" });
      }
    }
    y += BOX_HEIGHT + GAP;
  }

  // Database
  if (decisions.database) {
    const labels: Record<string, string | null> = {
      postgresql: "PostgreSQL",
      mongodb: "MongoDB",
      sqlite: "SQLite",
      none: null,
    };
    const dbLabel = labels[decisions.database];
    if (dbLabel) {
      boxes.push({
        id: "database",
        label: dbLabel,
        x: 0,
        y,
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
      });
      if (boxes.length > 1) {
        const prevId = boxes[boxes.length - 2].id;
        arrows.push({ from: prevId, to: "database" });
      }
    }
  }

  // Auth (side box, if present)
  if (decisions["auth-strategy"]) {
    const labels: Record<string, string> = {
      jwt: "JWT",
      session: "Sessions",
      oauth: "OAuth",
    };
    boxes.push({
      id: "auth",
      label: labels[decisions["auth-strategy"]] ?? "Auth",
      x: BOX_WIDTH + GAP,
      y: BOX_HEIGHT + GAP, // align roughly with frontend/backend area
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
    });
    // Connect auth to frontend
    if (boxes.find((b) => b.id === "frontend")) {
      arrows.push({ from: "frontend", to: "auth" });
    }
  }

  // Connect consecutive boxes that aren't already connected via arrows
  for (let i = 0; i < boxes.length - 1; i++) {
    const fromId = boxes[i].id;
    const toId = boxes[i + 1].id;
    const alreadyConnected = arrows.some(
      (a) => a.from === fromId && a.to === toId,
    );
    // Only connect main column boxes (exclude auth which is side-placed)
    if (!alreadyConnected && fromId !== "auth" && toId !== "auth") {
      arrows.push({ from: fromId, to: toId });
    }
  }

  return { boxes, arrows };
}
