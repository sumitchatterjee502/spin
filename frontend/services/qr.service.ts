import axios from "axios";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  CreateQRMappingAutoPayload,
  CreateQRMappingCustomPayload,
  QRMapping,
  UpdateQRMappingPayload,
} from "@/types/qr.types";
import axiosInstance from "@/utils/axiosInstance";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function normalizeMapping(raw: unknown): QRMapping {
  const r =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const code = String(r.code ?? r.qrCode ?? "").trim();
  const campaignId = Number(r.campaignId ?? r.campaign_id);
  return {
    id: Number(r.id),
    code,
    campaignId: Number.isFinite(campaignId) ? campaignId : 0,
    campaignName:
      typeof r.campaignName === "string" && r.campaignName.trim()
        ? r.campaignName.trim()
        : typeof r.campaign_name === "string" && r.campaign_name.trim()
          ? r.campaign_name.trim()
          : undefined,
    redirectUrl: String(
      r.redirectUrl ?? r.redirect_url ?? r.url ?? ""
    ).trim(),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
  };
}

function parseMappingsArray(raw: unknown): QRMapping[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeMapping)
    .filter((m) => Number.isFinite(m.id) && m.code.length > 0);
}

function parseListBody(body: unknown): QRMapping[] {
  const payload = extractResponseData(body);
  if (Array.isArray(payload)) return parseMappingsArray(payload);
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    const list =
      o.qrMappings ??
      o.mappings ??
      o.data ??
      o.items ??
      o.qr_mappings;
    if (Array.isArray(list)) return parseMappingsArray(list);
  }
  return [];
}

/**
 * `GET /admin/qr-mappings`
 */
export async function getQRMappings(
  accessToken?: string | null
): Promise<QRMapping[]> {
  const { data } = await axiosInstance.get<unknown>("/admin/qr-mappings", {
    headers: authHeaders(accessToken),
  });
  return parseListBody(data);
}

/**
 * Loads one mapping. Uses `GET /admin/qr-mappings/:id` when available;
 * otherwise falls back to the list endpoint.
 */
export async function getQRMapping(
  id: number,
  accessToken?: string | null
): Promise<QRMapping | null> {
  try {
    const { data } = await axiosInstance.get<unknown>(
      `/admin/qr-mappings/${encodeURIComponent(String(id))}`,
      { headers: authHeaders(accessToken) }
    );
    const inner = extractResponseData(data);
    const row =
      inner !== null && typeof inner === "object" && !Array.isArray(inner)
        ? inner
        : data;
    const m = normalizeMapping(row);
    if (m.id === id && m.code) return m;
    const list = await getQRMappings(accessToken);
    return list.find((x) => x.id === id) ?? null;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      const list = await getQRMappings(accessToken);
      return list.find((x) => x.id === id) ?? null;
    }
    throw e;
  }
}

/**
 * `POST /admin/qr-mappings` — auto-generated QR code (body: `{ campaignId }` only).
 */
export async function createQRMappingAuto(
  payload: CreateQRMappingAutoPayload,
  accessToken?: string | null
): Promise<QRMapping> {
  const { data } = await axiosInstance.post<unknown>(
    "/admin/qr-mappings",
    { campaignId: payload.campaignId },
    { headers: authHeaders(accessToken) }
  );
  return normalizeMapping(extractResponseData(data));
}

/**
 * `POST /admin/qr-mappings` — custom code (body: `{ code, campaignId }`).
 */
export async function createQRMappingCustom(
  payload: CreateQRMappingCustomPayload,
  accessToken?: string | null
): Promise<QRMapping> {
  const { data } = await axiosInstance.post<unknown>(
    "/admin/qr-mappings",
    {
      code: payload.code.trim(),
      campaignId: payload.campaignId,
    },
    { headers: authHeaders(accessToken) }
  );
  return normalizeMapping(extractResponseData(data));
}

/**
 * `PATCH /admin/qr-mappings/:id` — body: `{ campaignId }` only.
 */
export async function updateQRMapping(
  id: number,
  payload: UpdateQRMappingPayload,
  accessToken?: string | null
): Promise<QRMapping> {
  const { data } = await axiosInstance.patch<unknown>(
    `/admin/qr-mappings/${encodeURIComponent(String(id))}`,
    { campaignId: payload.campaignId },
    { headers: authHeaders(accessToken) }
  );
  return normalizeMapping(extractResponseData(data));
}

/**
 * `DELETE /admin/qr-mappings/:id`
 */
export async function deleteQRMapping(
  id: number,
  accessToken?: string | null
): Promise<void> {
  await axiosInstance.delete(
    `/admin/qr-mappings/${encodeURIComponent(String(id))}`,
    { headers: authHeaders(accessToken) }
  );
}
