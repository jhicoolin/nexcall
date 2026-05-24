import { notFound } from "next/navigation";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { councilAgents } from "@/lib/misato/mock/data";

export default async function AgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = councilAgents.find((a) => a.id === id);
  if (!agent) return notFound();
  return (
    <TacticalShell title={`Agent · ${agent.name}`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel title="PROFILE"><p>{agent.role}</p><p className="mt-2 text-sm">Permission level: {agent.permissionLevel}</p><RiskBadge level={agent.riskLevel} /></HudPanel>
        <HudPanel title="MEMORY + RULES"><p className="text-sm">Scope: {agent.memoryScope}</p><ul className="mt-2 list-disc pl-5 text-sm">{agent.approvalRules.map((r) => <li key={r}>{r}</li>)}</ul></HudPanel>
      </div>
      <HudPanel title="ABILITIES / BLOCKED ACTIONS">
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <ul className="list-disc pl-5">{agent.abilities.map((x) => <li key={x}>{x}</li>)}</ul>
          <ul className="list-disc pl-5 text-red-300">{agent.blockedActions.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </HudPanel>
    </TacticalShell>
  );
}
