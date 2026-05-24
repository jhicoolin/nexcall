import Link from "next/link";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { RiskBadge, StatusDot } from "@/components/misato/ui";
import { councilAgents } from "@/lib/misato/mock/data";

export default function AgentsPage() {
  return (
    <TacticalShell title="MISATO Agent Registry">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {councilAgents.map((a, i) => (
          <Link key={a.id} href={`/misato/agents/${a.id}`} className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 hover:border-cyan-400">
            <p className="text-xs text-zinc-400">Agent #{String(i + 1).padStart(3, "0")}</p>
            <p className="text-lg font-black">{a.name}</p>
            <p className="text-sm text-zinc-300">{a.role}</p>
            <div className="mt-2 flex items-center justify-between"><StatusDot status={a.status} /><RiskBadge level={a.riskLevel} /></div>
          </Link>
        ))}
      </div>
    </TacticalShell>
  );
}
