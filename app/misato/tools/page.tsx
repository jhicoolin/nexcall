import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { councilAgents, toolPermissions } from "@/lib/misato/mock/data";

export default function ToolsPage() {
  return (
    <TacticalShell title="Tool Access Control">
      <HudPanel title="LEAST-PRIVILEGE MATRIX">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-zinc-400"><th>Agent</th><th>Tool</th><th>Allowed</th><th>Level</th><th>Approval</th><th>Risk</th></tr></thead>
          <tbody>{toolPermissions.map((t) => <tr key={t.id} className="border-t border-zinc-800"><td>{councilAgents.find((a) => a.id === t.agentId)?.name}</td><td>{t.tool}</td><td>{t.allowed ? "Allowed" : "Blocked"}</td><td>{t.permissionLevel}</td><td>{t.approvalRequired ? "Required" : "No"}</td><td>{t.riskLevel}</td></tr>)}</tbody>
        </table>
      </HudPanel>
    </TacticalShell>
  );
}
