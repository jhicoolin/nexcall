import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";

export default function SettingsPage() {
  return (
    <TacticalShell title="Owner Settings">
      <div className="grid gap-4 md:grid-cols-2">
        <HudPanel title="OWNER / AUTH STATUS">
          <p className="text-sm">Owner email: nexcall@proton.me</p>
          <p className="text-sm">Auth status: owner-only enforced for /misato and /api/misato</p>
        </HudPanel>
        <HudPanel title="SYSTEM MODES">
          <ul className="list-disc pl-5 text-sm">
            <li>Safe mode: ON</li>
            <li>Desktop mode: Enabled (scaffold)</li>
            <li>Deployment mode: Preview-first approval flow</li>
            <li>Env status: configured placeholders only (no secret values shown)</li>
          </ul>
        </HudPanel>
      </div>
    </TacticalShell>
  );
}
