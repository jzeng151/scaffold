"use client";

import { useState, useEffect } from "react";
import { useWizard } from "@/lib/wizard-state";
import { decisionTree } from "@/lib/decision-tree";
import { isDecisionNode, isProjectDescription } from "@/lib/types";
import { DecisionCard } from "@/components/DecisionCard";
import { DocPreview } from "@/components/DocPreview";
import { encodeState } from "@/lib/url-state";
import { useRouter } from "next/navigation";

export default function WizardPage() {
  const router = useRouter();
  const wizard = useWizard();
  const [latestNodeId, setLatestNodeId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [mobileTab, setMobileTab] = useState<"decide" | "preview">("decide");
  const [previewNotification, setPreviewNotification] = useState(false);

  const { state, currentStep, progress, canGoBack, canGoForward } = wizard;

  // Track when a new section appears in the doc
  const decisionCount = Object.keys(state.decisions).length;

  useEffect(() => {
    if (decisionCount > 0) {
      const lastDecision = Object.keys(state.decisions).pop();
      if (lastDecision) {
        setLatestNodeId(lastDecision);
        setPreviewNotification(true);
        const timer = setTimeout(() => setPreviewNotification(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [decisionCount]);

  // Handle wizard completion
  useEffect(() => {
    if (state.isComplete) {
      setIsComplete(true);
    }
  }, [state.isComplete]);

  // ─── Completion Screen ─────────────────────────────────────

  if (isComplete) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar with share + restart */}
        <header
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-4) var(--space-8)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "var(--text-lg)" }}>
            Spec Forge
          </span>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button
              onClick={() => {
                wizard.reset();
                setIsComplete(false);
              }}
              style={{
                padding: "var(--space-2) var(--space-4)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
              }}
            >
              Start Over
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: "var(--space-2) var(--space-4)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
              }}
            >
              Download PDF
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/docs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectName: state.projectName,
                      description: state.projectDescription,
                    }),
                  });
                  if (!res.ok) throw new Error("Failed to create share link");
                  const data = await res.json();
                  const selections = encodeState(state.decisions, state.escapeDecisions);
                  const shareUrl = `${window.location.origin}/share/${data.id}?s=${selections}`;
                  await navigator.clipboard.writeText(shareUrl);
                  alert("Share link copied to clipboard!");
                } catch {
                  alert("Could not create share link. Please try again.");
                }
              }}
              style={{
                padding: "var(--space-2) var(--space-6)",
                background: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "var(--bg-base)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
              }}
            >
              Share Your Design Doc →
            </button>
          </div>
        </header>

        {/* Full-screen doc */}
        <div style={{ flex: 1, maxWidth: "800px", margin: "0 auto", width: "100%", padding: "var(--space-12) var(--space-8)" }}>
          <DocPreview state={state} />
        </div>
      </div>
    );
  }

  // ─── Wizard Screen ─────────────────────────────────────────

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-4) var(--space-8)",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <span
          onClick={() => router.push("/")}
          style={{
            fontWeight: 600,
            fontSize: "var(--text-lg)",
            cursor: "pointer",
          }}
        >
          Spec Forge
        </span>

        {/* Progress */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            Step {progress.current} of {progress.total}
          </span>
          <div
            style={{
              width: "120px",
              height: "6px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress.percent}%`,
                height: "100%",
                background: "var(--accent)",
                transition: "width var(--transition-base)",
                borderRadius: "var(--radius-full)",
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div
        className="mobile-tabs no-print"
        style={{
          display: "none",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <button
          onClick={() => setMobileTab("decide")}
          style={{
            flex: 1,
            padding: "var(--space-3)",
            background: "none",
            border: "none",
            borderBottom:
              mobileTab === "decide"
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            color: mobileTab === "decide" ? "var(--text-primary)" : "var(--text-tertiary)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            position: "relative",
          }}
        >
          Decide
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          style={{
            flex: 1,
            padding: "var(--space-3)",
            background: "none",
            border: "none",
            borderBottom:
              mobileTab === "preview"
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            color: mobileTab === "preview" ? "var(--text-primary)" : "var(--text-tertiary)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            position: "relative",
          }}
        >
          Preview
          {previewNotification && (
            <span
              style={{
                position: "absolute",
                top: "var(--space-2)",
                right: "calc(50% - 40px)",
                width: "8px",
                height: "8px",
                background: "var(--accent)",
                borderRadius: "var(--radius-full)",
              }}
            />
          )}
        </button>
      </div>

      {/* Main content — split screen on desktop, tabbed on mobile */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left panel: Decision */}
        <div
          className={`panel-decide ${mobileTab === "decide" ? "mobile-visible" : "mobile-hidden"}`}
          style={{
            flex: "1 1 50%",
            overflow: "hidden",
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Scrollable content area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
          {isProjectDescription(currentStep) ? (
            <div
              style={{
                padding: "var(--space-8)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-6)",
                flex: 1,
                justifyContent: "center",
                maxWidth: "600px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {currentStep.label}
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  Give your project a name so you know what you&apos;re building. Add a description
                  to keep yourself focused.
                </p>
              </div>
              <input
                type="text"
                value={state.projectName}
                onChange={(e) => wizard.setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canGoForward) wizard.next();
                }}
                placeholder={currentStep.placeholder}
                autoFocus
                aria-label="Project name"
                style={{
                  width: "100%",
                  padding: "var(--space-4)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-lg)",
                  fontFamily: "inherit",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
              />
              <textarea
                value={state.projectDescription}
                onChange={(e) => wizard.setProjectDescription(e.target.value)}
                placeholder="One paragraph describing what it does (optional)"
                aria-label="Project description"
                rows={3}
                style={{
                  width: "100%",
                  padding: "var(--space-4)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-base)",
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
              />
            </div>
          ) : isDecisionNode(currentStep) ? (
            <div style={{ flex: 1, maxWidth: "600px", margin: "0 auto", width: "100%", justifyContent: "center" }}>
              <DecisionCard
                node={currentStep}
                state={state}
                onSelect={wizard.selectOption}
                onEscape={wizard.selectEscape}
              />
            </div>
          ) : null}
          </div>

          {/* Navigation — pinned to bottom of left panel, always visible */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "var(--space-4) var(--space-8)",
              borderTop: "1px solid var(--border-subtle)",
              flexShrink: 0,
              background: "var(--bg-base)",
            }}
          >
            <button
              onClick={wizard.back}
              disabled={!canGoBack}
              style={{
                padding: "var(--space-2) var(--space-6)",
                background: "none",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: canGoBack ? "var(--text-secondary)" : "var(--text-tertiary)",
                cursor: canGoBack ? "pointer" : "not-allowed",
                opacity: canGoBack ? 1 : 0.5,
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
              }}
            >
              ← Back
            </button>
            <button
              onClick={wizard.next}
              disabled={!canGoForward}
              style={{
                padding: "var(--space-2) var(--space-6)",
                background: canGoForward ? "var(--accent)" : "var(--bg-elevated)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: canGoForward ? "var(--bg-base)" : "var(--text-tertiary)",
                fontWeight: 600,
                cursor: canGoForward ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right panel: Doc preview — scrolls independently */}
        <div
          className={`panel-preview ${mobileTab === "preview" ? "mobile-visible" : "mobile-hidden"}`}
          style={{
            flex: "1 1 50%",
            background: "var(--bg-base)",
            overflowY: "auto",
          }}
        >
          <DocPreview state={state} latestNodeId={latestNodeId} />
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 1023px) {
          .mobile-tabs {
            display: flex !important;
          }
          .panel-decide, .panel-preview {
            flex: 1 1 100% !important;
            border-right: none !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .mobile-visible {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-tabs {
            display: none !important;
          }
          .panel-decide, .panel-preview {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
