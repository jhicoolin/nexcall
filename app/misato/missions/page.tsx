import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { tasks } from "@/lib/misato/mock/data";

export default function MissionsPage() {
  return (
    <TacticalShell title="Mission Queue">
      <HudPanel title="ACTIVE MISSIONS">
        <ul className="space-y-2 text-sm">{tasks.filter((t) => t.status !== "Done").map((t) => <li key={t.id}>{t.title} · {t.status} · assigned {t.assignedAgentId || "unassigned"}</li>)}</ul>
      </HudPanel>
    </TacticalShell>
  );
}
