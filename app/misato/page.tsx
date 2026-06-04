import { MisatoCommandInput } from "@/components/misato/MisatoCommandInput";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { getRuntimeSnapshot } from "@/lib/misato/runtime/service";
import { getLiveProjectSummaryCounts } from "@/lib/misato/runtime/live-views";

export default function MisatoDashboard() {
  const { approvals: rawApprovals, logs: rawLogs, tasks: rawTasks } = getRuntimeSnapshot();
  const approvals = rawApprovals as Array<Record<string, any>>;
  const logs = rawLogs as Array<Record<string, any>>;
  const tasks = rawTasks as Array<Record<string, any>>;
  const projectCounts = getLiveProjectSummaryCounts();
  return (
    <TacticalShell title="Command Center Dashboard">
      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel title="PROJECTS"><p className="text-2xl font-black">{projectCounts.total}</p></HudPanel>
        <HudPanel title="MISSIONS"><p className="text-2xl font-black">{tasks.filter((t) => t.status !== "Done").length}</p></HudPanel>
        <HudPanel title="PENDING APPROVALS"><p className="text-2xl font-black">{approvals.filter((a) => a.status === "Pending").length}</p></HudPanel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MisatoCommandInput />
        <HudPanel title="SYSTEM LOG FEED">
          <ul className="space-y-2 text-sm">{logs.map((l) => <li key={String(l.id || l.timestamp || l.action)}>{String(l.timestamp || "unknown")} · {String(l.project || "MISATO")} · {String(l.action || l.message || "Log entry")} · <RiskBadge level={String(l.riskLevel || "Low") as "Low" | "Medium" | "High"} /></li>)}</ul>
        </HudPanel>
      </div>
    </TacticalShell>
  );
}
