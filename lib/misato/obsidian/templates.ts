import type { ObsidianDoc } from "./types";
export const dailyTemplate = (date: string): ObsidianDoc => ({ path: `00-command-center/${date}.md`, title: `Daily Command ${date}`, body: "# Daily Command\n" });
