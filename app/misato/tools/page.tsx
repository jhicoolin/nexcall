import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { getLiveCouncilAgents, getLiveToolPermissions } from "@/lib/misato/runtime/live-views";

export default function ToolsPage() {
  const councilAgents = getLiveCouncilAgents() as Array<Record<string, any>>;
  const toolPermissions = getLiveToolPermissions() as Array<Record<string, any>>;
  return (
    <TacticalShell title="Tool Access Control">
      <HudPanel title="LEAST-PRIVILEGE MATRIX">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-zinc-400"><th>Agent</th><th>Tool</th><th>Allowed</th><th>Level</th><th>Approval</th><th>Risk</th></tr></thead>
          <tbody>{toolPermissions.map((t) => <tr key={String(t.id || `${t.agentId}-${t.tool}`)} className="border-t border-zinc-800"><td>{councilAgents.find((a) => a.id === t.agentId)?.name}</td><td>{t.tool}</td><td>{t.allowed ? "Allowed" : "Blocked"}</td><td>{t.permissionLevel}</td><td>{t.approvalRequired ? "Required" : "No"}</td><td>{t.riskLevel}</td></tr>)}</tbody>
        </table>
      </HudPanel>
    </TacticalShell>
  );
}
