import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { getRuntimeSnapshot } from "@/lib/misato/runtime/service";

export default function MissionsPage() {
  const { tasks: rawTasks } = getRuntimeSnapshot();
  const tasks = rawTasks as Array<Record<string, any>>;
  return (
    <TacticalShell title="Mission Queue">
      <HudPanel title="ACTIVE MISSIONS">
        <ul className="space-y-2 text-sm">{tasks.filter((t) => t.status !== "Done").map((t) => <li key={String(t.id || t.title)}>{t.title} · {t.status} · assigned {t.assignedAgentId || "unassigned"}</li>)}</ul>
      </HudPanel>
    </TacticalShell>
  );
}
