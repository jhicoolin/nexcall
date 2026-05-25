export type DesignMode = "tactical-hud" | "operator-clean";

export type DesignLibraryStatus = {
  mode: DesignMode;
  activeDesignFile: string;
  claudeLaneStatus: "active" | "paused" | "handoff";
  componentsToPolish: string[];
  summary: string[];
};
