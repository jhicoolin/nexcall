import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { getLiveCouncilAgents } from "@/lib/misato/runtime/live-views";
import { getRuntimeSnapshot } from "@/lib/misato/runtime/service";

export default function CouncilPage() {
  const selected = getLiveCouncilAgents().slice(0, 6) as Array<Record<string, any>>;
  const { approvals, logs, tasks } = getRuntimeSnapshot();
  const pendingApprovals = approvals.filter((approval) => approval.status === "Pending").length;
  const latestContext = String(logs[0]?.action || logs[0]?.message || tasks[0]?.title || "No live command recorded yet");
  const liveFeed = logs.slice(0, 7).map((log) => String(log.action || log.message || "Log entry"));

  return (
    <TacticalShell title="Council Room">
      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel title="MISATO CORE STATUS"><p className="text-emerald-300">Online · Live runtime feedback enabled</p><p className="mt-2 text-sm">Latest context: {latestContext}</p></HudPanel>
        <HudPanel title="CONSENSUS SUMMARY"><p className="text-sm">Council uses live agent state and pending approvals from the runtime ledger.</p></HudPanel>
        <HudPanel title="APPROVAL NEEDED"><RiskBadge level="High" /><p className="mt-2 text-sm">{pendingApprovals > 0 ? `Yes - ${pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"} waiting.` : "No pending approvals right now."}</p></HudPanel>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {selected.map((a) => (
          <article key={String(a.id)} className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-3">
            <p className="font-bold">{a.name}</p>
            <p className="text-sm text-zinc-300">{a.role}</p>
            <p className="mt-2 text-xs text-cyan-200">Feedback: live runtime state is mirrored here without mock takeover.</p>
          </article>
        ))}
      </div>
      <HudPanel title="LIVE ACTIVITY FEED">
        <ul className="list-disc pl-5 text-sm">
          {liveFeed.length > 0 ? liveFeed.map((item, index) => <li key={`${index}-${item}`}>{item}</li>) : <li>No live feed events yet.</li>}
        </ul>
      </HudPanel>
    </TacticalShell>
  );
}
