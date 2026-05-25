export function getRequestHeader(request: Pick<Request, "headers"> | null | undefined, name: string) {
  if (!request) return "";
  return (request.headers.get(name) || "").trim();
}

export function isLocalRequest(request?: Pick<Request, "headers"> | null) {
  if (!request) return false;
  const hostCandidates = [
    getRequestHeader(request, "x-forwarded-host"),
    getRequestHeader(request, "host"),
    getRequestHeader(request, "origin"),
    getRequestHeader(request, "referer")
  ].map((value) => value.toLowerCase());

  return hostCandidates.some((raw) => {
    if (!raw) return false;
    const normalized = raw.replace(/^https?:\/\//, "").replace(/^tauri:\/\//, "");
    return normalized.startsWith("localhost") || normalized.startsWith("127.0.0.1") || normalized.startsWith("::1") || normalized.startsWith("tauri.localhost");
  });
}

export function getDesktopToken(request?: Pick<Request, "headers"> | null) {
  return getRequestHeader(request, "x-misato-desktop-token");
}
