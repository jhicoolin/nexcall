/**
 * MISATO Hook: Ledger Write (post-tool summarization)
 *
 * Fires AFTER any tool execution completes (success or failure).
 * Writes the outcome to the immutable run ledger.
 * Refreshes dependent state after mutations.
 *
 * Usage:
 *   const result = await runTool(...);
 *   await runLedgerWrite({ tool, arguments: args, status: 'success', result, durationMs });
 */

import { appendEventJsonl } from "../runtime/store";
import { publishEvent } from "../runtime/event-bus";

export type LedgerWriteInput = {
  tool: string;
  arguments: Record<string, unknown>;
  status: "success" | "failed";
  result?: unknown;
  error?: Error | string;
  durationMs: number;
  commandId?: string;
  agentId?: string;
  approvalId?: string;
  mcpId?: string;
};

const SECRET_KEYS = /\b(token|secret|password|key|api_key|auth|bearer|credential|private)\b/i;
const SECRET_VALUE_PATTERN = /^[a-zA-Z0-9+/=_\-]{12,}$/; // looks like a secret value

function nowIso(): string {
  return new Date().toISOString();
}

function rid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Deep-redact any object: replace values at secret-named keys with [REDACTED].
 * Also redact any string value that looks like a secret (long base64-ish string).
 */
function redactSecrets(obj: unknown, depth = 0): unknown {
  if (depth > 8) return obj; // guard against circular structures
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Don't redact short strings or obvious non-secrets
    if (obj.length >= 20 && SECRET_VALUE_PATTERN.test(obj)) return "[REDACTED]";
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item, depth + 1));
  }

  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_KEYS.test(k) ? "[REDACTED]" : redactSecrets(v, depth + 1),
      ])
    );
  }

  return obj;
}

/** Determine which UI views need to refresh based on which tool ran. */
function getAffectedViews(tool: string): string[] {
  const viewMap: Record<string, string[]> = {
    "vercel-deploy":    ["tasks", "lanes", "watchtower"],
    "git-push":         ["tasks", "lanes"],
    "rotate-secret":    ["sentinel", "tasks"],
    "update-env":       ["watchtower", "tasks"],
    "delete-file":      ["tasks"],
    "obsidian-write":   ["mirror"],
    "vault-write":      ["mirror"],
    "obs-sync":         ["mirror"],
    "scan-gitleaks":    ["sentinel"],
  };
  return viewMap[tool] || [];
}

/**
 * Write a tool execution result to the run ledger.
 * Emits an SSE event so live surfaces update immediately.
 */
export async function runLedgerWrite(input: LedgerWriteInput): Promise<void> {
  const {
    tool,
    arguments: args,
    status,
    result,
    error,
    durationMs,
    commandId,
    agentId,
    approvalId,
    mcpId,
  } = input;

  const eventType = status === "success" ? "mcp_call.completed" : "mcp_call.failed";
  const severity = status === "success" ? "info" as const : "error" as const;
  const affectedViews = getAffectedViews(tool);

  const entry = {
    id: rid("evt"),
    eventId: rid("evt"),
    timestamp: nowIso(),
    type: eventType,
    source: "misato.hooks",
    severity,
    payload: {
      tool,
      mcp: mcpId || "unknown",
      arguments: redactSecrets(args) as Record<string, unknown>,
      status,
      result: status === "success" ? redactSecrets(result) : undefined,
      error: status === "failed" ? (error instanceof Error ? error.message : String(error || "")) : undefined,
      durationMs,
      affectedViews,
    },
    ...(commandId ? { commandId } : {}),
    ...(agentId ? { agentId } : {}),
    ...(approvalId ? { approvalId } : {}),
  };

  // Write to immutable ledger
  appendEventJsonl(entry);

  // Emit to SSE stream so live feed and views update
  publishEvent(entry as any);

  // If the tool affected specific views, emit a refresh hint
  if (affectedViews.length > 0) {
    const refreshEvent = {
      id: rid("evt"),
      eventId: rid("evt"),
      timestamp: nowIso(),
      type: "views.refresh_needed",
      source: "misato.hooks",
      severity: "info" as const,
      payload: {
        views: affectedViews,
        trigger: tool,
        status,
      },
      ...(commandId ? { commandId } : {}),
    };
    publishEvent(refreshEvent as any);
    appendEventJsonl(refreshEvent);
  }
}
