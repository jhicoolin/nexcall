import { TacticalShell } from "@/components/misato/TacticalShell";
import { HudPanel } from "@/components/misato/ui";
import { misatoDesignTokens } from "@/lib/misato/design/designTokens";

const componentsToPolish = [
  "Status chips and connection diagnostics",
  "Command response stream hierarchy",
  "Approval/risk callout density",
  "Watchtower + Secret Sentinel cards"
];

export default function DesignLibraryPage() {
  return (
    <TacticalShell title="Design System Library">
      <div className="grid gap-4 md:grid-cols-3">
        <HudPanel title="CURRENT DESIGN MODE"><p className="font-bold">tactical-hud</p></HudPanel>
        <HudPanel title="ACTIVE FILE"><p className="text-sm">DESIGN.md</p></HudPanel>
        <HudPanel title="CLAUDE UI LANE"><p className="text-sm">handoff-ready</p></HudPanel>
      </div>

      <HudPanel title="DESIGN RULES SUMMARY">
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Black/graphite base with tactical panel hierarchy.</li>
          <li>Cyan for data, green safe, amber warning, red risk.</li>
          <li>Operator cockpit style over marketing visuals.</li>
          <li>No copyrighted/anime/proprietary copied assets.</li>
        </ul>
      </HudPanel>

      <HudPanel title="UI COMPONENTS TO POLISH">
        <ul className="list-disc pl-5 text-sm space-y-1">{componentsToPolish.map((c) => <li key={c}>{c}</li>)}</ul>
      </HudPanel>

      <HudPanel title="COPY PROMPT FOR CLAUDE">
        <pre className="whitespace-pre-wrap text-xs text-zinc-300">Use DESIGN.md and docs/design/CLAUDE_UI_STYLE_GUIDE.md. Keep tactical HUD style, preserve API behavior, and avoid auth/secret logic changes.</pre>
      </HudPanel>

      <HudPanel title="TOKEN SNAPSHOT">
        <pre className="text-xs">{JSON.stringify(misatoDesignTokens, null, 2)}</pre>
      </HudPanel>
    </TacticalShell>
  );
}
