import type { SecretFinding, SecretStatusPayload } from "./types";

export const mockFindings: SecretFinding[] = [];

export const mockSecretStatus: SecretStatusPayload = {
  ok: true,
  mode: "manual",
  lastScanAt: null,
  totalFindings: 0,
  highRiskCount: 0,
  redacted: true,
  findings: mockFindings,
  scope: "repo-only"
};
