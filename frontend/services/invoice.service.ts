import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  InvoiceEntry,
  InvoiceFilters,
  InvoiceListResult,
  InvoiceStatus,
  InvoiceSummary,
  UpdateInvoiceStatusPayload,
} from "@/types/invoice.types";

function authHeaders(accessToken?: string | null) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function toStatus(value: unknown): InvoiceStatus {
  if (value === "PROCESSING" || value === "DISPATCHED" || value === "DELIVERED") return value;
  return "APPROVED";
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeEntry(raw: unknown): InvoiceEntry {
  const row =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  return {
    participationId: toNumber(row.participationId ?? row.id ?? 0),
    name: String(row.name ?? "").trim(),
    phone: String(row.phone ?? "").trim(),
    email: String(row.email ?? "").trim(),
    shopLocation: String(row.shopLocation ?? row.storeLocation ?? "").trim(),
    prizeName: String(row.prizeName ?? "").trim(),
    invoiceNumber: String(row.invoiceNumber ?? "").trim(),
    status: toStatus(row.status),
    verifiedAt: String(row.verifiedAt ?? row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
  };
}

function parseEntries(raw: unknown): InvoiceEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeEntry)
    .filter((entry) => Number.isFinite(entry.participationId) && entry.participationId > 0);
}

function deriveSummary(entries: InvoiceEntry[], fallbackTotal: number): InvoiceSummary {
  const processing = entries.filter((entry) => entry.status === "PROCESSING").length;
  const dispatched = entries.filter((entry) => entry.status === "DISPATCHED").length;
  const delivered = entries.filter((entry) => entry.status === "DELIVERED").length;

  return {
    approved: Math.max(fallbackTotal, entries.length),
    processing,
    dispatched,
    delivered,
  };
}

function parseSummary(raw: unknown, entries: InvoiceEntry[], total: number): InvoiceSummary {
  const base = deriveSummary(entries, total);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const summary = raw as Record<string, unknown>;
  return {
    approved: toNumber(summary.approved ?? summary.totalApproved ?? summary.total ?? total, base.approved),
    processing: toNumber(summary.processing, base.processing),
    dispatched: toNumber(summary.dispatched, base.dispatched),
    delivered: toNumber(summary.delivered, base.delivered),
  };
}

export async function getInvoices(
  filters: InvoiceFilters,
  accessToken?: string | null
): Promise<InvoiceListResult> {
  const params = {
    status: filters.status || undefined,
    storeLocation: filters.storeLocation?.trim() || undefined,
    search: filters.search?.trim() || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };

  const { data } = await axiosInstance.get<unknown>("/admin/invoices", {
    params,
    headers: authHeaders(accessToken),
  });

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
    const total = toNumber(meta.total, entries.length);
    const page = toNumber(meta.page, filters.page ?? 1);
    const limit = toNumber(meta.limit, filters.limit ?? 10);
    return {
      entries,
      total,
      page,
      limit,
    };
  }

  const payload = extractResponseData(data);
  if (Array.isArray(payload)) {
    const entries = parseEntries(payload);
    const total = entries.length;
    return {
      entries,
      total,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
  }

  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    const body = payload as Record<string, unknown>;
    const list = body.items ?? body.entries ?? body.invoices ?? body.data ?? body.rows ?? [];
    const entries = parseEntries(list);
    const total = toNumber(body.total ?? body.totalCount ?? body.count, entries.length);
    return {
      entries,
      total,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
  }

  return {
    entries: [],
    total: 0,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };
}

export async function getInvoiceSummary(accessToken?: string | null): Promise<InvoiceSummary> {
  const { data } = await axiosInstance.get<unknown>("/admin/invoices/summary", {
    headers: authHeaders(accessToken),
  });

  const payload = extractResponseData(data);
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    return parseSummary(payload, [], 0);
  }
  return deriveSummary([], 0);
}

export async function updateInvoiceStatus(
  id: number,
  payload: UpdateInvoiceStatusPayload,
  accessToken?: string | null
): Promise<InvoiceEntry | null> {
  const { data } = await axiosInstance.patch<unknown>(
    `/admin/invoices/${encodeURIComponent(String(id))}/status`,
    payload,
    { headers: authHeaders(accessToken) }
  );

  const responsePayload = extractResponseData(data);
  if (
    responsePayload !== null &&
    typeof responsePayload === "object" &&
    !Array.isArray(responsePayload)
  ) {
    return normalizeEntry(responsePayload);
  }
  return null;
}

export function getInvoicesErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Unable to load invoices.";
  if (error.response?.status === 400) {
    const message = (error.response.data as { message?: string } | undefined)?.message;
    return message?.trim() || "Invalid filters provided.";
  }
  if (error.response?.status === 404) return "Not found";
  if (error.response?.status === 500) return "Server error. Please try again shortly.";
  return "Unable to load invoices.";
}
