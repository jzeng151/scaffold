"use client";

import type { DiagramData } from "@/lib/architecture-diagram-data";

interface ArchitectureDiagramProps {
  data: DiagramData;
}

/**
 * Custom SVG architecture diagram — zero dependencies.
 * Renders boxes and arrows from DiagramData. Read-only (no drag/zoom).
 */
export function ArchitectureDiagram({ data }: ArchitectureDiagramProps) {
  if (data.boxes.length === 0) {
    return null;
  }

  // Calculate SVG dimensions
  const maxX = Math.max(...data.boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...data.boxes.map((b) => b.y + b.height));
  const padding = 16;

  const boxMap = new Map(data.boxes.map((b) => [b.id, b]));

  return (
    <svg
      width={maxX + padding * 2}
      height={maxY + padding * 2}
      viewBox={`0 0 ${maxX + padding * 2} ${maxY + padding * 2}`}
      style={{ maxWidth: "100%", height: "auto" }}
      role="img"
      aria-label="Architecture diagram showing the tech stack components and their connections"
    >
      <g transform={`translate(${padding}, ${padding})`}>
        {/* Arrows */}
        {data.arrows.map((arrow, i) => {
          const from = boxMap.get(arrow.from);
          const to = boxMap.get(arrow.to);
          if (!from || !to) return null;

          // Arrow goes from bottom-center of source to top-center of target
          const x1 = from.x + from.width / 2;
          const y1 = from.y + from.height;
          const x2 = to.x + to.width / 2;
          const y2 = to.y;

          // Side arrows (auth) connect horizontally
          const isSideArrow =
            Math.abs(from.y - to.y) < from.height / 2 &&
            from.x !== to.x;

          const sx1 = isSideArrow ? from.x + from.width : x1;
          const sy1 = isSideArrow ? from.y + from.height / 2 : y1;
          const sx2 = isSideArrow ? to.x : x2;
          const sy2 = isSideArrow ? to.y + to.height / 2 : y2;

          const midY = (sy1 + sy2) / 2;

          return (
            <g key={`arrow-${i}`}>
              <line
                x1={sx1}
                y1={sy1}
                x2={sx2}
                y2={sy2}
                stroke="var(--border-default)"
                strokeWidth={1.5}
              />
              {/* Arrowhead */}
              <polygon
                points={
                  isSideArrow
                    ? `${sx2},${sy2} ${sx2 + 6},${sy2 - 4} ${sx2 + 6},${sy2 + 4}`
                    : `${sx2},${sy2} ${sx2 - 4},${sy2 - 6} ${sx2 + 4},${sy2 - 6}`
                }
                fill="var(--border-default)"
              />
            </g>
          );
        })}

        {/* Boxes */}
        {data.boxes.map((box) => (
          <g key={box.id}>
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              rx={8}
              fill="var(--bg-surface)"
              stroke="var(--border-default)"
              strokeWidth={1}
            />
            <text
              x={box.x + box.width / 2}
              y={box.y + box.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-primary)"
              fontSize={13}
              fontFamily="var(--font-mono)"
              fontWeight={500}
            >
              {box.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
