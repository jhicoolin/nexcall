import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { getRuntimeSnapshot } from "@/lib/misato/runtime/service";

export default function ApprovalsPage() {
  const { approvals: rawApprovals } = getRuntimeSnapshot();
  const approvals = rawApprovals as Array<Record<string, any>>;
  return (
    <TacticalShell title="Approval Gate">
      <div className="space-y-3">
        {approvals.map((a) => (
          <HudPanel key={String(a.id || `${a.actionType}-${a.project}`)} title={`${a.actionType} · ${a.project}`}>
            <p className="text-sm">Reason: {a.reason}</p>
            <p className="text-sm">Preview: {a.preview}</p>
            <p className="text-sm">Requested agent: {a.requestedAgent}</p>
            <div className="mt-2"><RiskBadge level={a.riskLevel} /></div>
            <div className="mt-3 flex gap-2">
              <button className="rounded border border-emerald-500/50 px-2 py-1 text-xs opacity-60" disabled title="Use the live desktop approval actions for mutations">Approve</button>
              <button className="rounded border border-red-500/50 px-2 py-1 text-xs opacity-60" disabled title="Use the live desktop approval actions for mutations">Reject</button>
              <button className="rounded border border-amber-500/50 px-2 py-1 text-xs opacity-60" disabled title="Use the live desktop approval actions for mutations">Request revision</button>
            </div>
          </HudPanel>
        ))}
      </div>
    </TacticalShell>
  );
}
