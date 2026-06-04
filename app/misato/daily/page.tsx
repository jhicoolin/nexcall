import { MisatoCommandInput } from "@/components/misato/MisatoCommandInput";
import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel, PriorityBadge, RiskBadge } from "@/components/misato/ui";
import { getRuntimeSnapshot } from "@/lib/misato/runtime/service";
import { getLiveProjectSummaryCounts } from "@/lib/misato/runtime/live-views";

function formatDueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-zinc-500">{label}</p>;
}

function toDateValue(value: unknown) {
  return new Date(String(value || ""));
}

export default function DailyPage() {
  const snapshot = getRuntimeSnapshot();
  const approvals = snapshot.approvals as Array<Record<string, any>>;
  const tasks = snapshot.tasks as Array<Record<string, any>>;
  const projectCounts = getLiveProjectSummaryCounts();
  const today = new Date();
  const highPriorityOpen = tasks.filter((t) => t.priority === "High" && t.status !== "Done");
  const overdue = tasks
    .filter((t) => toDateValue(t.dueDate || t.dueAt).getTime() < today.getTime() && t.status !== "Done")
    .sort((a, b) => toDateValue(a.dueDate || a.dueAt).getTime() - toDateValue(b.dueDate || b.dueAt).getTime());
  const blocked = tasks.filter((t) => t.status === "Blocked").sort((a, b) => toDateValue(a.dueDate || a.dueAt).getTime() - toDateValue(b.dueDate || b.dueAt).getTime());
  const pendingApprovals = approvals
    .filter((a) => a.status === "Pending")
    .sort((a, b) => toDateValue(a.createdAt).getTime() - toDateValue(b.createdAt).getTime());

  const focusOrder = [
    blocked.length ? `Unblock ${blocked.length} blocked task${blocked.length === 1 ? "" : "s"}` : null,
    pendingApprovals.length ? `Clear ${pendingApprovals.length} pending approval${pendingApprovals.length === 1 ? "" : "s"}` : null,
    highPriorityOpen.length ? `Ship ${highPriorityOpen[0].title}` : null
  ].filter(Boolean) as string[];

  return (
    <TacticalShell title="Daily Command View">
      <div className="grid gap-4 lg:grid-cols-4">
        <HudPanel title="OPEN HIGH-PRIORITY TASKS"><p className="text-2xl font-black">{highPriorityOpen.length}</p></HudPanel>
        <HudPanel title="BLOCKED TASKS"><p className="text-2xl font-black">{blocked.length}</p></HudPanel>
        <HudPanel title="OVERDUE TASKS"><p className="text-2xl font-black">{overdue.length}</p></HudPanel>
        <HudPanel title="PENDING APPROVALS"><p className="text-2xl font-black">{pendingApprovals.length}</p></HudPanel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <HudPanel title="TODAY'S CRITICAL MISSIONS">
          {highPriorityOpen.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {highPriorityOpen.map((t) => (
                <li key={String(t.id || t.title)} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-black/20 px-3 py-2">
                  <span className="font-medium text-zinc-100">{t.title}</span>
                  <PriorityBadge level={t.priority} />
                  <RiskBadge level={t.riskLevel} />
                  <span className="text-xs text-zinc-400">Due {formatDueDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="No high-priority tasks are open right now." />
          )}
        </HudPanel>

        <HudPanel title="SUGGESTED FOCUS ORDER">
          {focusOrder.length > 0 ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {focusOrder.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : (
            <EmptyState label="Backlog is clear. Pick a new mission." />
          )}
        </HudPanel>

        <HudPanel title="OVERDUE TASKS">
          {overdue.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {overdue.map((t) => (
                <li key={String(t.id || t.title)} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-black/20 px-3 py-2">
                  <span className="font-medium text-zinc-100">{t.title}</span>
                  <span className="text-xs text-zinc-400">Was due {formatDueDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="No overdue tasks. Keep it that way." />
          )}
        </HudPanel>

        <HudPanel title="PENDING APPROVALS">
          {pendingApprovals.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {pendingApprovals.map((a) => (
                <li key={String(a.id || a.actionType)} className="rounded border border-zinc-800 bg-black/20 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-100">{a.actionType}</span>
                    <RiskBadge level={a.riskLevel} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{a.project} · requested by {a.requestedAgent}</p>
                  <p className="mt-1 text-xs text-zinc-500">{a.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="No approvals waiting. Move on." />
          )}
        </HudPanel>
      </div>

      <div className="mt-4"><MisatoCommandInput /></div>
      <p className="mt-4 text-xs text-zinc-400">Blocked tasks: {blocked.length} · High-priority projects: {projectCounts.highPriority}</p>
    </TacticalShell>
  );
}
