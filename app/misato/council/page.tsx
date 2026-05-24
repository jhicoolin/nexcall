import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { councilAgents } from "@/lib/misato/mock/data";

const currentCommand = "Prepare private MISATO launch plan with safe desktop path";

export default function CouncilPage() {
  const selected = councilAgents.slice(0, 6);
  const risks = ["Production deploy request requires owner approval", "Auth changes require review"];
  return (
    <TacticalShell title="Council Room">
      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel title="MISATO CORE STATUS"><p className="text-emerald-300">Online · Mock live feedback enabled</p><p className="mt-2 text-sm">Current command: {currentCommand}</p></HudPanel>
        <HudPanel title="CONSENSUS SUMMARY"><p className="text-sm">Council agrees to stage changes via PR + preview deployment and queue risky actions for owner approval.</p></HudPanel>
        <HudPanel title="APPROVAL NEEDED"><RiskBadge level="High" /><p className="mt-2 text-sm">Yes — risky deployment/auth scopes detected.</p></HudPanel>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {selected.map((a) => (
          <article key={a.id} className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-3">
            <p className="font-bold">{a.name}</p>
            <p className="text-sm text-zinc-300">{a.role}</p>
            <p className="mt-2 text-xs text-cyan-200">Feedback: {a.name} recommends scoped safe-mode execution.</p>
          </article>
        ))}
      </div>
      <HudPanel title="LIVE/MOCK ACTIVITY FEED"><ul className="list-disc pl-5 text-sm"><li>Command received</li><li>Project detected</li><li>Council selected</li><li>Agents responding</li><li>Risks scanned</li><li>Summary generated</li><li>Approval queued</li></ul></HudPanel>
    </TacticalShell>
  );
}
