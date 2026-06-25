import { Suspense } from "react";
import type { Metadata } from "next";
import { SharedDocContent } from "./doc-content";

interface SharedDocPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SharedDocPageProps): Promise<Metadata> {
  const { id } = await params;
  const { s } = await searchParams;
  const ogUrl = s
    ? `/api/og?id=${id}&s=${s}`
    : `/api/og?id=${id}`;

  return {
    title: "Design Doc — Spec Forge",
    description: "A design doc created with Spec Forge. Design your project before you build it.",
    openGraph: {
      title: "Design Doc — Spec Forge",
      description: "A design doc created with Spec Forge. Design your project before you build it.",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Design Doc — Spec Forge",
      description: "A design doc created with Spec Forge. Design your project before you build it.",
      images: [ogUrl],
    },
  };
}

export default async function SharedDocPage({
  params,
  searchParams,
}: SharedDocPageProps) {
  const { id } = await params;
  const { s } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
      }}
    >
      {/* Branded header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-4) var(--space-8)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "var(--text-lg)",
          }}
        >
          Spec Forge
        </span>
        <a
          href="/"
          style={{
            fontSize: "var(--text-sm)",
          }}
        >
          Create your own →
        </a>
      </header>

      {/* Doc content — streamed with Suspense */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "var(--space-12) var(--space-8)",
        }}
      >
        <Suspense
          fallback={
            <SharedDocSkeleton selectionsParam={s} />
          }
        >
          <SharedDocContent id={id} selectionsParam={s} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Skeleton that renders immediately from URL-encoded selections.
 * Shows the architecture diagram + decisions while description streams from KV.
 */
function SharedDocSkeleton({ selectionsParam }: { selectionsParam?: string }) {
  // We can't decode here (client-side only), so just show a loading state
  return (
    <div style={{ opacity: 0.5 }}>
      <div
        style={{
          height: "32px",
          width: "60%",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-4)",
        }}
      />
      <div
        style={{
          height: "16px",
          width: "100%",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "var(--space-8)",
        }}
      />
      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Loading design doc...
      </p>
    </div>
  );
}
