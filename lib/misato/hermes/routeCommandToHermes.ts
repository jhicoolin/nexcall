import { routeCommandToMockHermes } from "./mockHermesOrchestrator";
import type { HermesCommandInput } from "./types";

export function routeCommandToHermes(input: HermesCommandInput) {
  return routeCommandToMockHermes(input);
}
