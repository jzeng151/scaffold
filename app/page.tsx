"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "var(--space-8)",
        gap: "var(--space-4)",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          Spec Forge
        </h1>
        <p
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--text-secondary)",
          }}
        >
          Design your project before you build it. Free, no signup.
        </p>
        <button
          onClick={() => router.push("/wizard")}
          style={{
            padding: "var(--space-3) var(--space-8)",
            background: "var(--accent)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "var(--bg-base)",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: "var(--space-4)",
          }}
        >
          Start Designing →
        </button>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            marginTop: "var(--space-2)",
          }}
        >
          8 decisions · 15 minutes · No account needed
        </p>
      </div>
    </main>
  );
}
