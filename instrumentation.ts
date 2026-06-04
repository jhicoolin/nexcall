import { validateSecurityEnvOnce } from "./lib/env-security";

export async function register() {
  validateSecurityEnvOnce();
}
