import axios from "axios";
import { extractResponseData } from "@/lib/api/standardResponse";
import type { QrFrontendSettings } from "@/types/qr-frontend-settings.types";
import axiosInstance from "@/utils/axiosInstance";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function stripTrailingSlash(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function normalizeSettingsBody(raw: unknown): QrFrontendSettings | null {
  const inner = extractResponseData(raw);
  const o =
    inner !== null && typeof inner === "object" && !Array.isArray(inner)
      ? (inner as Record<string, unknown>)
      : raw !== null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null;
  if (!o) return null;
  const url = String(
    o.frontendBaseUrl ?? o.frontend_base_url ?? ""
  ).trim();
  if (!url) return null;
  return { frontendBaseUrl: stripTrailingSlash(url) };
}

/**
 * Loads saved frontend base URL when the backend exposes `GET /admin/qr-frontend-settings`.
 */
export async function getQrFrontendSettings(
  accessToken?: string | null
): Promise<QrFrontendSettings | null> {
  try {
    const { data } = await axiosInstance.get<unknown>(
      "/admin/qr-frontend-settings",
      { headers: authHeaders(accessToken) }
    );
    return normalizeSettingsBody(data);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * `PUT /admin/qr-frontend-settings`
 * Body: `{ "frontendBaseUrl": "https://…" }`
 */
export async function putQrFrontendSettings(
  payload: QrFrontendSettings,
  accessToken?: string | null
): Promise<void> {
  await axiosInstance.put(
    "/admin/qr-frontend-settings",
    {
      frontendBaseUrl: stripTrailingSlash(payload.frontendBaseUrl),
    },
    { headers: authHeaders(accessToken) }
  );
}
