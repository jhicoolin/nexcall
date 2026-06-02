/**
 * MISATO Verification Status Schema — shared by all check scripts.
 *
 * result values:
 *   "loaded"             — component was loaded/rendered; no deeper contract checked
 *   "verified"           — explicit assertion made and passed with evidence
 *   "partially_verified" — some assertions passed, others were skipped or could not be run
 *   "unverified"         — check not executed in this pass (env constraint, needs browser, etc.)
 *   "failed"             — check was executed and assertion failed
 *
 * Human-readable convention (use in notes + humanReadable):
 *   loaded:             "Shell loaded successfully; runtime-origin contract not checked in this pass."
 *   verified:           "Endpoint contract verified: {endpoint} returned expected shape."
 *   partially_verified: "Source contract checked; live runtime not tested — run misato:smoke."
 *   unverified:         "{Check} not run — {reason}. Run {command} locally to verify."
 *   failed:             "{Check} FAILED: {assertion} — {evidence}."
 */

/** @param {string} component @param {string} check @param {string} result @param {unknown} evidence @param {string} notes @returns {import('./misato-check-schema.mjs').CheckEntry} */
export function checkEntry(component, check, result, evidence, notes) {
  return { component, check, result, evidence, notes, timestamp: new Date().toISOString() };
}

/** @param {import('./misato-check-schema.mjs').CheckEntry[]} checks @param {string} humanReadable @param {Record<string,unknown>} [meta] */
export function buildReport(checks, humanReadable, meta = {}) {
  const counts = { loaded: 0, verified: 0, partially_verified: 0, unverified: 0, failed: 0 };
  for (const c of checks) counts[c.result] = (counts[c.result] || 0) + 1;
  return {
    schemaVersion: "1.0",
    timestamp: new Date().toISOString(),
    ...meta,
    checks,
    summary: counts,
    ok: counts.failed === 0,
    humanReadable
  };
}

/**
 * @typedef {{ component: string, check: string, result: 'loaded'|'verified'|'partially_verified'|'unverified'|'failed', evidence: unknown, notes: string, timestamp: string }} CheckEntry
 */
