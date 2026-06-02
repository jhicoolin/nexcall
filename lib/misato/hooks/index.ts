/**
 * MISATO Hook Registry
 *
 * Hooks are runtime enforcement points that fire before and after critical operations.
 * They are the implementation of the policies defined in docs/misato/HOOKS.md.
 *
 * Import and call these from Hermes route handlers and the command machine.
 * Do NOT bypass hooks. Do NOT add inline approval logic outside these functions.
 */

export { runDestructiveToolGuard, type DestructiveToolGuardInput } from "./destructive-tool-guard";
export { runLedgerWrite, type LedgerWriteInput } from "./ledger-write";
export { runSubagentStart, runSubagentStop, type SubagentStartInput, type SubagentStopInput } from "./subagent-lifecycle";
export { runErrorRecovery, type ErrorRecoveryInput } from "./error-recovery";
