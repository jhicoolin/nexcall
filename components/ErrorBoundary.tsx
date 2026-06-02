'use client';

import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : "An unexpected client error occurred.";
  return (
    <div
      role="alert"
      style={{
        margin: "24px",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 99, 99, 0.45)",
        background: "rgba(66, 18, 18, 0.92)",
        color: "#fff"
      }}
    >
      <p style={{ margin: 0, fontWeight: 700 }}>Something went wrong.</p>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: "8px", marginBottom: "12px" }}>{message}</pre>
      <button
        type="button"
        onClick={resetErrorBoundary}
        style={{
          border: "none",
          borderRadius: "8px",
          padding: "8px 12px",
          background: "#ffffff",
          color: "#111827",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        Try again
      </button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={Fallback}>
      {children}
    </ReactErrorBoundary>
  );
}
