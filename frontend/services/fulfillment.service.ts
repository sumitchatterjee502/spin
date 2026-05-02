import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  ConfirmWinnerPayload,
  DispatchPrizePayload,
  FulfillmentEntry,
  FulfillmentFilters,
  FulfillmentListResult,
  FulfillmentStatus,
  SlaStatus,
} from "@/types/fulfillment.types";

function authHeaders(accessToken?: string | null) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStatus(value: unknown): FulfillmentStatus {
  if (value === "CONFIRMED" || value === "DISPATCHED" || value === "DELIVERED") return value;
  return "APPROVED";
}

function toSlaStatus(value: unknown): SlaStatus {
  if (value === "WITHIN_SLA" || value === "BREACHED") return value;
  return "NOT_STARTED";
}

function toDateString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeEntry(raw: unknown): FulfillmentEntry {
  const row =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const isLockedValue = row.isLocked ?? row.locked ?? row.transactionLocked;
  const status = toStatus(row.status ?? row.fulfillmentStatus);

  return {
    participationId: toNumber(row.participationId ?? row.id ?? 0),
    name: String(row.name ?? "").trim(),
    prize: String(row.prize ?? row.prizeName ?? "").trim(),
    invoiceNumber: String(row.invoiceNumber ?? "").trim(),
    status,
    slaStatus: toSlaStatus(row.slaStatus ?? row.sla),
    address: String(row.address ?? "").trim(),
    trackingId: String(row.trackingId ?? "").trim(),
    deliveryPartner: String(row.deliveryPartner ?? "").trim(),
    storeLocation: String(row.storeLocation ?? row.shopLocation ?? "").trim(),
    remarks: String(row.remarks ?? row.notes ?? "").trim(),
    confirmedAt: toDateString(row.confirmedAt ?? row.verifiedAt),
    dispatchDate: toDateString(row.dispatchDate),
    deliveryDate: toDateString(row.deliveryDate),
    updatedAt: toDateString(row.updatedAt),
    isLocked: Boolean(isLockedValue ?? false),
  };
}

function parseEntries(raw: unknown): FulfillmentEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEntry).filter((entry) => Number.isFinite(entry.participationId) && entry.participationId > 0);
}

function parseListResponse(data: unknown, filters: FulfillmentFilters): FulfillmentListResult {
  const defaultMeta = {
    total: 0,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };

  const envelope =
    data !== null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  if (envelope && Array.isArray(envelope.data)) {
    const entries = parseEntries(envelope.data);
    const meta =
      envelope.meta !== null &&
      typeof envelope.meta === "object" &&
      !Array.isArray(envelope.meta)
        ? (envelope.meta as Record<string, unknown>)
        : {};
    return {
      data: entries,
      meta: {
        total: toNumber(meta.total, entries.length),
        page: toNumber(meta.page, defaultMeta.page),
        limit: toNumber(meta.limit, defaultMeta.limit),
      },
    };
  }

  const payload = extractResponseData(data);
  if (Array.isArray(payload)) {
    const entries = parseEntries(payload);
    return {
      data: entries,
      meta: {
        ...defaultMeta,
        total: entries.length,
      },
    };
  }

  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    const body = payload as Record<string, unknown>;
    const list = body.items ?? body.entries ?? body.winners ?? body.data ?? body.rows ?? [];
    const entries = parseEntries(list);
    return {
      data: entries,
      meta: {
        total: toNumber(body.total ?? body.totalCount ?? body.count, entries.length),
        page: toNumber(body.page, defaultMeta.page),
        limit: toNumber(body.limit, defaultMeta.limit),
      },
    };
  }

  return { data: [], meta: defaultMeta };
}

function parseSingleResponse(data: unknown): FulfillmentEntry | null {
  const payload = extractResponseData(data);
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    return normalizeEntry(payload);
  }
  return null;
}

export async function getFulfillmentList(
  filters: FulfillmentFilters,
  accessToken?: string | null,
  signal?: AbortSignal
): Promise<FulfillmentListResult> {
  const params = {
    status: filters.status || undefined,
    storeLocation: filters.storeLocation?.trim() || undefined,
    search: filters.search?.trim() || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };

  const { data } = await axiosInstance.get<unknown>("/admin/fulfillment", {
    params,
    signal,
    headers: authHeaders(accessToken),
  });
  return parseListResponse(data, filters);
}

export async function getFulfillmentById(
  id: number,
  accessToken?: string | null,
  signal?: AbortSignal
): Promise<FulfillmentEntry | null> {
  const { data } = await axiosInstance.get<unknown>(
    `/admin/fulfillment/${encodeURIComponent(String(id))}`,
    {
      signal,
      headers: authHeaders(accessToken),
    }
  );
  return parseSingleResponse(data);
}

export async function confirmWinner(
  id: number,
  payload: ConfirmWinnerPayload,
  accessToken?: string | null
): Promise<FulfillmentEntry | null> {
  const { data } = await axiosInstance.post<unknown>(
    `/admin/fulfillment/${encodeURIComponent(String(id))}/confirm`,
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
  return parseSingleResponse(data);
}

export async function dispatchPrize(
  id: number,
  payload: DispatchPrizePayload,
  accessToken?: string | null
): Promise<FulfillmentEntry | null> {
  const { data } = await axiosInstance.post<unknown>(
    `/admin/fulfillment/${encodeURIComponent(String(id))}/dispatch`,
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
  return parseSingleResponse(data);
}

export async function markDelivered(id: number, accessToken?: string | null): Promise<FulfillmentEntry | null> {
  const { data } = await axiosInstance.patch<unknown>(
    `/admin/fulfillment/${encodeURIComponent(String(id))}/deliver`,
    undefined,
    {
      headers: authHeaders(accessToken),
    }
  );
  return parseSingleResponse(data);
}

export function getFulfillmentErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Unable to process request.";
  if (error.response?.status === 400) {
    const body = error.response.data as { message?: string | string[] } | undefined;
    if (Array.isArray(body?.message)) return body.message[0] || "Validation error. Please check submitted fields.";
    if (typeof body?.message === "string" && body.message.trim()) return body.message;
    return "Validation error. Please check submitted fields.";
  }
  if (error.response?.status === 404) return "Record not found";
  if (error.response?.status === 409) {
    const body = error.response.data as { message?: string } | undefined;
    return body?.message?.trim() || "Conflict detected. This record may already be locked.";
  }
  if (error.response?.status === 500) return "Server error. Please try again shortly.";
  return "Unable to process request.";
}
