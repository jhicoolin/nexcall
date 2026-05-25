export type SecretFinding = {
  ruleId: string;
  description: string;
  file: string;
  line: number;
  fingerprint: string;
  secret: "[REDACTED]";
  severity: "low" | "medium" | "high";
};

export type SecretStatusPayload = {
  ok: boolean;
  mode: "off" | "manual" | "scheduled";
  lastScanAt: string | null;
  totalFindings: number;
  highRiskCount: number;
  redacted: true;
  findings: SecretFinding[];
  scope: "repo-only";
};
