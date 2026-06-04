import Link from "next/link";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { PriorityBadge, RiskBadge } from "@/components/misato/ui";
import { getLiveProjects } from "@/lib/misato/runtime/live-views";

export default function ProjectsPage() {
  const projects = getLiveProjects() as Array<Record<string, any>>;
  return (
    <TacticalShell title="Projects">
      <div className="grid gap-3 md:grid-cols-2">
        {projects.map((p) => (
          <Link key={String(p.id || p.slug)} href={`/misato/projects/${String(p.slug || p.id || "")}`} className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 hover:border-cyan-400">
            <p className="text-lg font-black">{p.name}</p>
            <p className="text-sm text-zinc-300">{p.description}</p>
            <div className="mt-2 flex items-center justify-between"><PriorityBadge level={p.priority} /><RiskBadge level={p.riskLevel} /></div>
          </Link>
        ))}
      </div>
    </TacticalShell>
  );
}
