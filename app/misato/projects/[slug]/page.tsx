import { notFound } from "next/navigation";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, RiskBadge } from "@/components/misato/ui";
import { getLiveProjectBySlug, getLiveProjectTasks } from "@/lib/misato/runtime/live-views";

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getLiveProjectBySlug(slug);
  if (!project) return notFound();
  const projectTasks = getLiveProjectTasks(project.slug) as Array<Record<string, any>>;

  return (
    <TacticalShell title={`Project · ${project.name}`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel title="OBJECTIVE"><p>{project.currentObjective}</p><p className="mt-2 text-sm text-zinc-300">Next: {project.nextAction}</p></HudPanel>
        <HudPanel title="RISK"><RiskBadge level={project.riskLevel} /></HudPanel>
      </div>
      <HudPanel title="TASKS">
        <ul className="mt-2 space-y-2 text-sm">{projectTasks.map((t) => <li key={String(t.id || t.title)}>{t.title} · {t.status} · {t.dueDate || t.dueAt || "unscheduled"}</li>)}</ul>
      </HudPanel>
    </TacticalShell>
  );
}
