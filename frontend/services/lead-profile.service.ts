import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  LeadProfile,
  LeadReceipt,
  LeadsListParams,
  LeadsListResult,
  LeadsPagination,
} from "@/types/lead-profile.types";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function normalizeLeadReceipt(raw: unknown): LeadReceipt {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    leadId: Number(r.leadId),
    userId: typeof r.userId === "number" ? r.userId : null,
    imageUrl: String(r.imageUrl ?? ""),
    receiptNumber: String(r.receiptNumber ?? ""),
    fileType: String(r.fileType ?? ""),
    hash: String(r.hash ?? ""),
    pHash: typeof r.pHash === "string" ? r.pHash : null,
    isUsed: Boolean(r.isUsed),
    createdAt: String(r.createdAt ?? ""),
  };
}

function normalizeLead(raw: unknown): LeadProfile {
  const l = raw as Record<string, unknown>;
  return {
    id: Number(l.id),
    name: String(l.name ?? ""),
    phone: String(l.phone ?? ""),
    email: String(l.email ?? ""),
    shopLocation: String(l.shopLocation ?? ""),
    address: String(l.address ?? ""),
    campaignId: Number(l.campaignId),
    qrMappingId: Number(l.qrMappingId),
    acceptTerms: Boolean(l.acceptTerms),
    createdAt: String(l.createdAt ?? ""),
    updatedAt: String(l.updatedAt ?? ""),
    receipts: Array.isArray(l.receipts) ? l.receipts.map(normalizeLeadReceipt) : [],
  };
}

function parseLeadsListBody(body: unknown): LeadsListResult {
  const payload = extractResponseData(body);
  const data =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const itemsRaw = data.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeLead) : [];

  const paginationRaw =
    data.pagination !== null && typeof data.pagination === "object" && !Array.isArray(data.pagination)
      ? (data.pagination as Record<string, unknown>)
      : {};

  const fallbackLimit = items.length > 0 ? items.length : 10;
  const pagination: LeadsPagination = {
    page: typeof paginationRaw.page === "number" ? paginationRaw.page : 1,
    limit: typeof paginationRaw.limit === "number" ? paginationRaw.limit : fallbackLimit,
    total: typeof paginationRaw.total === "number" ? paginationRaw.total : items.length,
    totalPages:
      typeof paginationRaw.totalPages === "number"
        ? paginationRaw.totalPages
        : Math.max(1, Math.ceil(items.length / fallbackLimit)),
    hasNextPage: Boolean(paginationRaw.hasNextPage),
    hasPreviousPage: Boolean(paginationRaw.hasPreviousPage),
  };

  return { items, pagination };
}

export async function listLeads(
  params: LeadsListParams,
  accessToken?: string | null
): Promise<LeadsListResult> {
  const { page, limit, search, campaignId } = params;
  const query: Record<string, string | number> = { page, limit };
  const trimmedSearch = search?.trim();
  if (trimmedSearch) query.search = trimmedSearch;
  if (campaignId != null && Number.isFinite(campaignId)) query.campaignId = campaignId;

  const { data } = await axiosInstance.get<unknown>("/leads", {
    params: query,
    headers: authHeaders(accessToken),
  });

  return parseLeadsListBody(data);
}
