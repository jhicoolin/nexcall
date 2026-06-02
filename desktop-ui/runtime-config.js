(function () {
  const DEFAULT_RUNTIME_ORIGIN = "http://127.0.0.1:3010";

  function normalizeRuntimeOrigin(raw) {
    const value = String(raw || "").trim();
    if (!value) return DEFAULT_RUNTIME_ORIGIN;

    try {
      const url = new URL(value.includes("://") ? value : `http://${value}`);
      if (!url.port) url.port = "3010";
      const pathname = url.pathname.replace(/\/+$/, "");
      if (pathname && pathname !== "/") {
        return DEFAULT_RUNTIME_ORIGIN;
      }
      if (url.hostname === "localhost" || url.hostname === "0.0.0.0") {
        url.hostname = "127.0.0.1";
      }
      return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
    } catch {
      return DEFAULT_RUNTIME_ORIGIN;
    }
  }

  function normalizeApiBaseUrl(raw) {
    const value = String(raw || "").trim().replace(/\/+$/, "");
    if (!value) return "";

    try {
      const url = new URL(value.includes("://") ? value : `http://${value}`);
      const pathname = url.pathname.replace(/\/+$/, "");
      if (!pathname || pathname === "/") {
        url.pathname = "/api/misato";
      } else if (!pathname.endsWith("/api/misato")) {
        url.pathname = `${pathname}/api/misato`;
      }
      return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
    } catch {
      return value.endsWith("/api/misato") ? value : `${value}/api/misato`;
    }
  }

  function splitRuntimeOrigin(raw) {
    const origin = normalizeRuntimeOrigin(raw);
    const url = new URL(origin);
    return {
      origin,
      host: url.hostname,
      port: url.port || "3010"
    };
  }

  const injectedRuntimeOrigin = normalizeRuntimeOrigin(
    window.__MISATO_RUNTIME_ORIGIN__ || ""
  );
  const injectedPreviewApiBaseUrl = normalizeApiBaseUrl(
    window.__MISATO_PREVIEW_API_BASE_URL__ || window.__MISATO_API_BASE_URL__ || ""
  );

  window.__MISATO_RUNTIME_CONFIG__ = Object.freeze({
    defaultRuntimeOrigin: DEFAULT_RUNTIME_ORIGIN,
    runtimeOrigin: injectedRuntimeOrigin,
    previewApiBaseUrl: injectedPreviewApiBaseUrl,
    normalizeRuntimeOrigin,
    normalizeApiBaseUrl,
    splitRuntimeOrigin
  });
  window.__MISATO_RUNTIME_ORIGIN__ = injectedRuntimeOrigin;
  if (injectedPreviewApiBaseUrl) {
    window.__MISATO_PREVIEW_API_BASE_URL__ = injectedPreviewApiBaseUrl;
  }
})();
