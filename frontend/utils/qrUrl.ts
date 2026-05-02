/**
 * Builds the public landing URL encoded in printed QR codes.
 * Prefer `NEXT_PUBLIC_QR_REDIRECT_ORIGIN` in production (packaging / short links).
 */
export function getDefaultQrRedirectOrigin(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_QR_REDIRECT_ORIGIN?.trim()
      : "";
  return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/$/, "") : "";
}

/**
 * Order: API-saved frontend base → env → browser origin (client only).
 */
export function resolveQrPublicOrigin(
  apiFrontendBaseUrl: string | null | undefined
): string {
  const api = apiFrontendBaseUrl?.trim().replace(/\/$/, "") ?? "";
  if (api) return api;
  const env = getDefaultQrRedirectOrigin();
  if (env) return env;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function buildCampaignQrRedirectUrl(
  publicOrigin: string,
  code: string
): string {
  const base = publicOrigin.replace(/\/$/, "");
  const path = "/campaign";
  const q = new URLSearchParams({ qr: code.trim() });
  return `${base}${path}?${q.toString()}`;
}

/** Accepts http(s) URLs and rejects obvious mistakes before submit. */
export function isValidPublicRedirectUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}
