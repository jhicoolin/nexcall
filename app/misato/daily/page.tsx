import { MisatoCommandInput } from "@/components/misato/MisatoCommandInput";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { approvals, projects, tasks } from "@/lib/misato/mock/data";

export default function DailyPage() {
  const overdue = tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "Done");
  const blocked = tasks.filter((t) => t.status === "Blocked");
  const critical = tasks.filter((t) => t.priority === "High" && t.status !== "Done");
  return (
    <TacticalShell title="Daily Command View">
      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel title="TODAY'S CRITICAL MISSIONS"><ul className="list-disc pl-5 text-sm">{critical.map((t) => <li key={t.id}>{t.title}</li>)}</ul></HudPanel>
        <HudPanel title="SUGGESTED FOCUS ORDER"><ol className="list-decimal pl-5 text-sm"><li>Resolve blocked tasks</li><li>Handle pending approvals</li><li>Ship one high-priority mission</li></ol></HudPanel>
        <HudPanel title="OVERDUE TASKS"><ul className="list-disc pl-5 text-sm">{overdue.map((t) => <li key={t.id}>{t.title}</li>)}</ul></HudPanel>
        <HudPanel title="PENDING APPROVALS"><ul className="list-disc pl-5 text-sm">{approvals.map((a) => <li key={a.id}>{a.actionType} · {a.project}</li>)}</ul></HudPanel>
      </div>
      <div className="mt-4"><MisatoCommandInput /></div>
      <p className="mt-4 text-xs text-zinc-400">Blocked tasks: {blocked.length} · High-priority projects: {projects.filter((p) => p.priority === "High").length}</p>
    </TacticalShell>
  );
}
