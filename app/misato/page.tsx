import { MisatoCommandInput } from "@/components/misato/MisatoCommandInput";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { approvals, logs, projects, tasks } from "@/lib/misato/mock/data";

export default function MisatoDashboard() {
  return (
    <TacticalShell title="Command Center Dashboard">
      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel title="PROJECTS"><p className="text-2xl font-black">{projects.length}</p></HudPanel>
        <HudPanel title="MISSIONS (MOCK)"><p className="text-2xl font-black">{tasks.filter((t) => t.status !== "Done").length}</p></HudPanel>
        <HudPanel title="PENDING APPROVALS"><p className="text-2xl font-black">{approvals.filter((a) => a.status === "Pending").length}</p></HudPanel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MisatoCommandInput />
        <HudPanel title="SYSTEM LOG FEED">
          <ul className="space-y-2 text-sm">{logs.map((l) => <li key={l.id}>{l.timestamp} · {l.project} · {l.action} · <RiskBadge level={l.riskLevel} /></li>)}</ul>
        </HudPanel>
      </div>
    </TacticalShell>
  );
}
