import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { readRedactedGitleaksSummary } from "@/lib/misato/secrets/gitleaksParser";

export default function SecretSentinelPage() {
  const status = readRedactedGitleaksSummary();

  return (
    <TacticalShell title="Secret Sentinel · Gitleaks">
      <div className="grid gap-4 md:grid-cols-3">
        <HudPanel title="SCAN MODE"><p className="font-bold uppercase">{status.mode}</p></HudPanel>
        <HudPanel title="TOTAL FINDINGS"><p className="text-2xl font-black">{status.totalFindings}</p></HudPanel>
        <HudPanel title="HIGH RISK"><p className="text-2xl font-black text-red-300">{status.highRiskCount}</p></HudPanel>
      </div>

      <HudPanel title="SCAN SUMMARY">
        <p className="text-sm">Last scan: {status.lastScanAt ? new Date(status.lastScanAt).toLocaleString() : "Not run"}</p>
        <p className="text-sm">Scope: {status.scope}</p>
        <p className="text-sm">Redaction: enabled</p>
        <p className="text-sm mt-2">Run manually: <code>npm run secrets:scan</code></p>
        <p className="text-xs text-zinc-400 mt-2">Approval Gate: any remediation edits/deletions require owner approval.</p>
      </HudPanel>

      <HudPanel title="REDACTED FINDINGS">
        {status.findings.length === 0 ? <p className="text-sm text-zinc-400">No redacted findings available.</p> : (
          <ul className="space-y-2 text-xs">{status.findings.map((f) => <li key={f.fingerprint}>{f.ruleId} · {f.file}:{f.line} · {f.secret}</li>)}</ul>
        )}
      </HudPanel>
    </TacticalShell>
  );
}
