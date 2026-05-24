import { TacticalShell } from "@/components/misato/TacticalShell";
import { PriorityBadge, RiskBadge } from "@/components/misato/ui";
import { projects, tasks } from "@/lib/misato/mock/data";

const columns = ["Idea", "Doing", "Blocked", "Done"] as const;

export default function KanbanPage() {
  return (
    <TacticalShell title="Kanban">
      <p className="mb-3 text-xs text-zinc-400">Project filter (simple): {projects.map((p) => p.name).join(" · ")}</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((c) => (
          <section key={c} className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-3">
            <p className="text-xs tracking-[0.2em] text-cyan-300">{c.toUpperCase()}</p>
            <div className="mt-2 space-y-2">
              {tasks.filter((t) => t.status === c).map((t) => (
                <article key={t.id} className="rounded border border-zinc-700 bg-black/40 p-2 text-sm">
                  <p className="font-semibold">{t.title}</p>
                  <div className="mt-1 flex justify-between"><PriorityBadge level={t.priority} /><RiskBadge level={t.riskLevel} /></div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TacticalShell>
  );
}
