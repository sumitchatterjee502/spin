import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  VerificationActionType,
  VerificationEntry,
  VerificationFilters,
  VerificationListResult,
  VerificationStatus,
} from "@/types/verification.types";

function authHeaders(accessToken?: string | null) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function toStatus(value: unknown): VerificationStatus {
  if (value === "APPROVED" || value === "REJECTED" || value === "DISPATCHED" || value === "DELIVERED" || value === "RECEIVED" || value === "PENDING" || value === "PROCESSING") return value;
  return "PENDING";
}

function normalizeEntry(raw: unknown): VerificationEntry {
  const row =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const prize =
    row.prize !== null && typeof row.prize === "object" && !Array.isArray(row.prize)
      ? (row.prize as Record<string, unknown>)
      : null;
  return {
    id: Number(row.id ?? 0),
    name: String(row.name ?? "").trim(),
    phone: String(row.phone ?? "").trim(),
    email: String(row.email ?? "").trim(),
    prizeName: String(row.prizeName ?? prize?.name ?? row.prize ?? "").trim(),
    result: row.result === "LOSE" ? "LOSE" : "WIN",
    shopLocation: String(row.shopLocation ?? row.storeLocation ?? "").trim(),
    receiptNumber: String(row.receiptNumber ?? "").trim(),
    fileUrl: String(row.fileUrl ?? row.receiptUrl ?? "").trim(),
    status: toStatus(row.status),
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    purchaseDate: String(row.purchaseDate ?? row.purchase_date ?? ""),
    remarks: String(row.remarks ?? "").trim(),
    invoiceNumber: String(row.invoiceNumber ?? row.invoice_number ?? "").trim(),
  };
}

function parseEntries(raw: unknown): VerificationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeEntry)
    .filter((entry) => Number.isFinite(entry.id) && entry.id > 0);
}

export async function getVerificationEntries(
  filters: VerificationFilters,
  accessToken?: string | null,
  signal?: AbortSignal
): Promise<VerificationListResult> {
  const params = {
    result: "WIN",
    status: filters.status || undefined,
    storeLocation: filters.storeLocation?.trim() || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    search: filters.search?.trim() || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
    sortBy: filters.sortBy || undefined,
    sortOrder: filters.sortOrder ?? "DESC",
  };

  const { data } = await axiosInstance.get<unknown>("/admin/verifications", {
    params,
    headers: authHeaders(accessToken),
    signal,
  });

  const envelope =
    data !== null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  if (envelope && Array.isArray(envelope.data)) {
    const entries = parseEntries(envelope.data).filter((entry) => entry.result === "WIN");
    const meta =
      envelope.meta !== null &&
      typeof envelope.meta === "object" &&
      !Array.isArray(envelope.meta)
        ? (envelope.meta as Record<string, unknown>)
        : {};
    const total = Number(meta.total ?? entries.length);
    const page = Number(meta.page ?? filters.page ?? 1);
    const limit = Number(meta.limit ?? filters.limit ?? 10);
    return {
      entries,
      total: Number.isFinite(total) ? total : entries.length,
      page: Number.isFinite(page) ? page : filters.page ?? 1,
      limit: Number.isFinite(limit) ? limit : filters.limit ?? 10,
    };
  }

  const payload = extractResponseData(data);
  if (Array.isArray(payload)) {
    const entries = parseEntries(payload).filter((entry) => entry.result === "WIN");
    return { entries, total: entries.length, page: filters.page ?? 1, limit: filters.limit ?? 10 };
  }

  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    const body = payload as Record<string, unknown>;
    const list =
      body.items ??
      body.entries ??
      body.verifications ??
      body.data ??
      body.rows ??
      [];
    const entries = parseEntries(list).filter((entry) => entry.result === "WIN");
    const totalRaw = Number(body.total ?? body.totalCount ?? body.count ?? entries.length);
    return {
      entries,
      total: Number.isFinite(totalRaw) ? totalRaw : entries.length,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
  }

  return { entries: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 10 };
}

export function getVerificationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Unable to load verification entries.";
  if (error.code === "ERR_CANCELED") return "";
  if (error.response?.status === 400) {
    const message = (error.response.data as { message?: string } | undefined)?.message;
    return message?.trim() || "Invalid filters provided.";
  }
  if (error.response?.status === 500) return "Server error. Please try again shortly.";
  return "Unable to load verification entries.";
}

export async function submitVerificationAction(
  id: number,
  action: VerificationActionType,
  remarks: string,
  invoiceNumber: string | null,
  accessToken?: string | null
): Promise<VerificationEntry | null> {
  const endpoint = action === "APPROVE" ? "approve" : "reject";
  const payload =
    action === "APPROVE"
      ? { invoiceNumber: invoiceNumber?.trim() ?? "", remarks: remarks.trim() }
      : { remarks: remarks.trim() };
  const { data } = await axiosInstance.post<unknown>(
    `/admin/verifications/${encodeURIComponent(String(id))}/${endpoint}`,
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

export function getVerificationActionErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Unable to submit verification action.";
  if (error.response?.status === 400) {
    const message = (error.response.data as { message?: string } | undefined)?.message;
    return message?.trim() || "Please provide valid required fields (invoice and remarks).";
  }
  if (error.response?.status === 404) return "Participation not found";
  if (error.response?.status === 409) {
    const message = (error.response.data as { message?: string } | undefined)?.message;
    return message?.trim() || "This entry is already verified.";
  }
  if (error.response?.status === 500) return "Server error. Please try again shortly.";
  return "Unable to submit verification action.";
}
