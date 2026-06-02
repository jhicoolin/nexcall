/**
 * MISATO Hook: Error Recovery
 *
 * Fires when an operation fails with a potentially transient error.
 * Classifies the error, schedules retries for transient failures,
 * logs everything to the run ledger, and returns structured recovery info.
 *
 * Usage:
 *   const recovery = await runErrorRecovery({ operation, endpoint, statusCode, error, attempt });
 *   if (recovery.shouldRetry) {
 *     await delay(recovery.retryAfterMs);
 *     // retry the operation
 *   }
 */

import { appendEventJsonl } from "../runtime/store";
import { publishEvent } from "../runtime/event-bus";

export type ErrorRecoveryInput = {
  operation: string;     // human-readable name: "Load agents", "Scan secrets", etc.
  endpoint: string;      // e.g. "GET /api/misato/agents"
  statusCode: number;    // HTTP status code or 0 for network errors
  error: Error | string; // the actual error
  attempt: number;       // 1-based attempt number (1 = first try)
  commandId?: string;
  agentId?: string;
};

export type ErrorRecoveryResult = {
  shouldRetry: boolean;
  retryAfterMs: number;     // 0 if shouldRetry is false
  isFinal: boolean;         // true if we've given up
  userMessage: string;      // copy-deck compliant message for the UI
  logEntryId: string;       // ID of the ledger entry written
};

/** HTTP status codes that indicate a transient failure worth retrying. */
const TRANSIENT_CODES = new Set([408, 429, 500, 502, 503, 504, 0]);

/** Maximum number of automatic retry attempts before giving up. */
const MAX_RETRIES = 3;

function nowIso(): string {
  return new Date().toISOString();
}

function rid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: Error | string): string {
  return error instanceof Error ? error.message : String(error);
}

/** Exponential backoff: 1s, 2s, 4s, then give up. */
function backoffMs(attempt: number): number {
  return Math.min(Math.pow(2, attempt - 1) * 1000, 4000);
}

function buildUserMessage(
  operation: string,
  endpoint: string,
  statusCode: number,
  errorMessage: string,
  attempt: number,
  shouldRetry: boolean,
  isFinal: boolean
): string {
  if (isFinal) {
    return `✗ ${operation} failed after ${attempt} attempts.\n  Endpoint: ${endpoint}\n  Error: ${errorMessage}\n  Suggestion: Check Hermes health or try again later.`;
  }
  if (shouldRetry) {
    const retryIn = Math.round(backoffMs(attempt) / 1000);
    return `◌ ${operation} failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${retryIn}s…\n  Endpoint: ${endpoint}`;
  }
  // Final, non-transient error
  const suggestion =
    statusCode === 401
      ? "Authentication failed. Re-enter your owner token in Settings."
      : statusCode === 403
      ? "Forbidden. Check your permission configuration."
      : statusCode === 404
      ? `Endpoint not found. Hermes version may not support ${endpoint} yet.`
      : `Unexpected error. Check Hermes logs for details.`;
  return `✗ ${operation} failed.\n  Endpoint: ${endpoint}\n  Status: ${statusCode}\n  Error: ${errorMessage}\n  Suggestion: ${suggestion}`;
}

/**
 * Handle an operation failure. Returns recovery instructions.
 * Always writes to the run ledger regardless of outcome.
 */
export async function runErrorRecovery(
  input: ErrorRecoveryInput
): Promise<ErrorRecoveryResult> {
  const { operation, endpoint, statusCode, error, attempt, commandId, agentId } = input;

  const isTransient = TRANSIENT_CODES.has(statusCode);
  const shouldRetry = isTransient && attempt < MAX_RETRIES;
  const isFinal = !shouldRetry && (attempt >= MAX_RETRIES || !isTransient);
  const retryAfterMs = shouldRetry ? backoffMs(attempt) : 0;
  const errorMessage = getErrorMessage(error);

  const userMessage = buildUserMessage(
    operation,
    endpoint,
    statusCode,
    errorMessage,
    attempt,
    shouldRetry,
    isFinal
  );

  const logEntryId = rid("evt");

  const entry = {
    id: logEntryId,
    eventId: logEntryId,
    timestamp: nowIso(),
    type: isFinal ? "operation.failed_final" : shouldRetry ? "operation.failed_retrying" : "operation.failed",
    source: "misato.hooks",
    severity: isFinal ? "error" as const : "warn" as const,
    payload: {
      operation,
      endpoint,
      statusCode,
      errorMessage,
      attempt,
      maxRetries: MAX_RETRIES,
      shouldRetry,
      isFinal,
      retryAfterMs,
      isTransient,
    },
    ...(commandId ? { commandId } : {}),
    ...(agentId ? { agentId } : {}),
  };

  appendEventJsonl(entry);
  publishEvent(entry as any);

  return {
    shouldRetry,
    retryAfterMs,
    isFinal,
    userMessage,
    logEntryId,
  };
}
