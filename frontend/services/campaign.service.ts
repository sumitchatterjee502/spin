import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  Campaign,
  CampaignLandingDetails,
  CampaignsListParams,
  CampaignsListResult,
  CreateCampaignPayload,
  Product,
} from "@/types/campaign.types";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

/** Converts `<input type="date">` values (`YYYY-MM-DD`) to API ISO strings. */
function wireCampaignWritePayload<T extends { startDate?: string; endDate?: string }>(
  payload: T
): T {
  const out = { ...payload } as Record<string, unknown>;
  if (
    typeof out.startDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(out.startDate)
  ) {
    out.startDate = `${out.startDate}T00:00:00.000Z`;
  }
  if (
    typeof out.endDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(out.endDate)
  ) {
    out.endDate = `${out.endDate}T23:59:59.000Z`;
  }
  return out as T;
}

function normalizeProduct(raw: unknown): Product {
  const p = raw as Record<string, unknown>;
  return {
    id: Number(p.id),
    name: String(p.name ?? ""),
  };
}

function normalizeCampaign(raw: unknown): Campaign {
  const payload = extractResponseData(raw);
  const c =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const productsRaw = c.products;
  const products = Array.isArray(productsRaw)
    ? productsRaw.map(normalizeProduct)
    : [];
  return {
    id: Number(c.id),
    name: String(c.name ?? ""),
    startDate: String(c.startDate ?? ""),
    endDate: String(c.endDate ?? ""),
    status: (c.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as Campaign["status"],
    products,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : undefined,
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : undefined,
  };
}

function parseCampaignsListBody(body: unknown): CampaignsListResult {
  const payload = extractResponseData(body);
  const data =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const list = data.campaigns;
  const campaigns = Array.isArray(list)
    ? list.map(normalizeCampaign)
    : [];
  const total =
    typeof data.total === "number" ? data.total : campaigns.length;
  const page = typeof data.page === "number" ? data.page : 1;
  const limit = typeof data.limit === "number" ? data.limit : campaigns.length || 10;
  return { campaigns, total, page, limit };
}

export async function listCampaigns(
  accessToken?: string | null
): Promise<Campaign[]> {
  const { data } = await axiosInstance.get<unknown>("/campaigns", {
    headers: authHeaders(accessToken),
  });
  return parseCampaignsListBody(data).campaigns;
}
/**
 * Paginated campaigns list (`GET /campaigns?page=&limit=&search=&status=`).
 */
export async function listCampaignsPaginated(
  params: CampaignsListParams,
  accessToken?: string | null
): Promise<CampaignsListResult> {
  const { page, limit, search, status } = params;
  const query: Record<string, string | number> = { page, limit };
  const q = search?.trim();
  if (q) query.search = q;
  if (status && status !== "ALL") query.status = status;

  const { data } = await axiosInstance.get<unknown>("/campaigns", {
    params: query,
    headers: authHeaders(accessToken),
  });
  return parseCampaignsListBody(data);
}

/**
 * Resolves a campaign by scanning paginated list results (no single-item endpoint assumed).
 */
export async function getCampaignByIdFromApi(
  campaignId: number,
  accessToken?: string | null
): Promise<Campaign | null> {
  let page = 1;
  const limit = 100;
  for (let i = 0; i < 50; i++) {
    const res = await listCampaignsPaginated(
      { page, limit, search: "" },
      accessToken
    );
    const found = res.campaigns.find((c) => c.id === campaignId);
    if (found) return found;
    if (page * limit >= res.total || res.campaigns.length === 0) break;
    page += 1;
  }
  return null;
}

export async function createCampaign(
  payload: CreateCampaignPayload,
  accessToken?: string | null
): Promise<Campaign> {
  const body = wireCampaignWritePayload(payload);
  const { data } = await axiosInstance.post<unknown>("/campaigns", body, {
    headers: authHeaders(accessToken),
  });
  return normalizeCampaign(data);
}

export async function updateCampaign(
  id: number,
  payload: Partial<CreateCampaignPayload>,
  accessToken?: string | null
): Promise<Campaign> {
  const body = wireCampaignWritePayload(payload);
  const { data } = await axiosInstance.patch<unknown>(
    `/campaigns/${id}`,
    body,
    {
      headers: authHeaders(accessToken),
    }
  );
  return normalizeCampaign(data);
}

export async function mapProductsToCampaign(
  id: number,
  productIds: number[],
  accessToken?: string | null,
  replaceExisting = true
): Promise<void> {
  await axiosInstance.post(
    `/campaigns/${id}/products`,
    { productIds, replaceExisting },
    {
      headers: authHeaders(accessToken),
    }
  );
}

function normalizeCampaignLandingDetails(raw: unknown): CampaignLandingDetails | null {
  const payload = extractResponseData(raw);
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const p = payload as Record<string, unknown>;
  const branding =
    p.branding !== null && typeof p.branding === "object" && !Array.isArray(p.branding)
      ? (p.branding as Record<string, unknown>)
      : null;
  const title = String(branding?.primary ?? p.campaignName ?? p.title ?? p.name ?? "").trim();
  if (!title) return null;

  const secondaryBranding = String(branding?.secondary ?? "").trim();
  const offer = String(p.offer ?? "").trim();
  return {
    title,
    subtitle:
      secondaryBranding ||
      (typeof p.subtitle === "string" && p.subtitle.trim() ? p.subtitle.trim() : undefined),
    offer: offer || undefined,
    brandLogos: Array.isArray(p.brandLogos)
      ? p.brandLogos.map(String).filter(Boolean)
      : undefined,
    prizes: Array.isArray(p.prizes)
      ? p.prizes.map(String).filter(Boolean)
      : undefined,
  };
}

/**
 * Public campaign details by QR code (used by `/campaign` page).
 * Returns `null` when endpoint is unavailable or QR is unknown.
 */
export async function getCampaignLandingByQr(
  qrCode: string
): Promise<CampaignLandingDetails | null> {
  const qr = qrCode.trim();
  if (!qr) return null;
  try {
    const { data } = await axiosInstance.get<unknown>("/campaign", {
      params: { qr },
    });
    return normalizeCampaignLandingDetails(data);
  } catch {
    return null;
  }
}
