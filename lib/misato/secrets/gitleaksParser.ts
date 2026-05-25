import fs from "fs";
import path from "path";
import type { SecretFinding, SecretStatusPayload } from "./types";
import { mockSecretStatus } from "./mockFindings";

const REPORT_PATH = path.join(process.cwd(), ".security", "gitleaks-report.redacted.json");

export function readRedactedGitleaksSummary(): SecretStatusPayload {
  if (!fs.existsSync(REPORT_PATH)) return mockSecretStatus;

  try {
    const raw = fs.readFileSync(REPORT_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;

    const findings: SecretFinding[] = parsed.slice(0, 100).map((f) => ({
      ruleId: String(f.RuleID || "unknown"),
      description: String(f.Description || "Potential secret detected"),
      file: String(f.File || "unknown"),
      line: Number(f.StartLine || 0),
      fingerprint: String(f.Fingerprint || "unknown"),
      secret: "[REDACTED]",
      severity: String((f.Tags as string[] | undefined)?.includes("high") ? "high" : "medium") as "low" | "medium" | "high"
    }));

    return {
      ok: true,
      mode: "manual",
      lastScanAt: new Date().toISOString(),
      totalFindings: findings.length,
      highRiskCount: findings.filter((x) => x.severity === "high").length,
      redacted: true,
      findings,
      scope: "repo-only"
    };
  } catch {
    return mockSecretStatus;
  }
}
