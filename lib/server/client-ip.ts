interface RequestWithHeaders {
  headers: {
    get(name: string): string | null;
  };
  ip?: string;
}

function normalizeHeaderValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function firstForwardedForIp(value: string | null) {
  return normalizeHeaderValue(value?.split(",")[0]);
}

function trustProxyHeaders() {
  return process.env.TRUST_PROXY_HEADERS === "true" || process.env.TRUST_PROXY_HEADERS === "1";
}

function directClientIp(request: RequestWithHeaders) {
  return normalizeHeaderValue(request.ip) || "local";
}

export function getClientIpFromRequest(request: RequestWithHeaders) {
  if (!trustProxyHeaders()) {
    return directClientIp(request);
  }

  return (
    firstForwardedForIp(request.headers.get("x-forwarded-for")) ||
    normalizeHeaderValue(request.headers.get("x-real-ip")) ||
    directClientIp(request)
  );
}
