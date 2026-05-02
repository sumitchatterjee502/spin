import axios from "axios";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  AdminCatalogPrize,
  AdminCatalogProduct,
  PrizeConfigFromApi,
  SavePrizeConfigPayload,
} from "@/types/prize-config.types";
import axiosInstance from "@/utils/axiosInstance";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function asId(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string") return raw;
  return String(raw);
}

function normalizeAdminProduct(raw: unknown): AdminCatalogProduct {
  const p = raw as Record<string, unknown>;
  return {
    id: asId(p.id),
    name: String(p.name ?? ""),
  };
}

function normalizeAdminPrize(raw: unknown): AdminCatalogPrize {
  const p = raw as Record<string, unknown>;
  return {
    id: asId(p.id),
    name: String(p.name ?? ""),
  };
}

function normalizeProductsList(inner: unknown): AdminCatalogProduct[] {
  if (Array.isArray(inner)) {
    return inner.map(normalizeAdminProduct);
  }
  if (inner && typeof inner === "object" && "products" in inner) {
    const list = (inner as { products?: unknown }).products;
    if (Array.isArray(list)) return list.map(normalizeAdminProduct);
  }
  return [];
}

function normalizePrizesList(inner: unknown): AdminCatalogPrize[] {
  if (Array.isArray(inner)) {
    return inner.map(normalizeAdminPrize);
  }
  if (inner && typeof inner === "object" && "prizes" in inner) {
    const list = (inner as { prizes?: unknown }).prizes;
    if (Array.isArray(list)) return list.map(normalizeAdminPrize);
  }
  return [];
}

function readLimits(raw: unknown): PrizeConfigFromApi["distributionLimits"] {
  const d =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const n = (k: string) => {
    const v = d[k];
    return typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
  };
  return {
    maxPerDay: n("maxPerDay"),
    maxPerUser: n("maxPerUser"),
    totalLimit: n("totalLimit"),
  };
}

function normalizePrizeConfigFromBody(
  body: unknown,
  campaignId: string
): PrizeConfigFromApi {
  const payload = extractResponseData(body);
  const root =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const mappingsRaw = root.mappings;
  const mappings = Array.isArray(mappingsRaw)
    ? mappingsRaw
        .map((m) => {
          const row = m as Record<string, unknown>;
          return {
            productId: asId(row.productId),
            prizeId: asId(row.prizeId),
          };
        })
        .filter((m) => m.productId && m.prizeId)
    : [];

  const inventoryRaw = root.inventory;
  const inventory = Array.isArray(inventoryRaw)
    ? inventoryRaw.map((row) => {
        const r = row as Record<string, unknown>;
        const stock =
          typeof r.stock === "number" && Number.isFinite(r.stock)
            ? r.stock
            : Number(r.stock) || 0;
        const remaining =
          typeof r.remainingStock === "number" && Number.isFinite(r.remainingStock)
            ? r.remainingStock
            : typeof r.remaining === "number"
              ? r.remaining
              : undefined;
        return {
          prizeId: asId(r.prizeId),
          stock,
          remainingStock: remaining,
        };
      })
    : [];

  return {
    campaignId: asId(root.campaignId) || campaignId,
    mappings,
    inventory,
    distributionLimits: readLimits(root.distributionLimits),
  };
}

/**
 * `GET /admin/products` — optional `search` query for server-side filtering.
 */
export async function listAdminProducts(
  accessToken?: string | null,
  search?: string
): Promise<AdminCatalogProduct[]> {
  const q = search?.trim();
  const { data } = await axiosInstance.get<unknown>("/products", {
    params: q ? { search: q } : undefined,
    headers: authHeaders(accessToken),
  });
  const inner = extractResponseData<unknown>(data);
  return normalizeProductsList(inner);
}

/** `GET /admin/prizes` */
export async function listAdminPrizes(
  accessToken?: string | null
): Promise<AdminCatalogPrize[]> {
  const { data } = await axiosInstance.get<unknown>("/admin/prizes", {
    headers: authHeaders(accessToken),
  });
  const inner = extractResponseData<unknown>(data);
  return normalizePrizesList(inner);
}

/**
 * `POST /admin/prizes` — create a prize by name (for “create prize” in mapping UI).
 * Response body is normalized like list items.
 */
export async function createAdminPrize(
  payload: { name: string },
  accessToken?: string | null
): Promise<AdminCatalogPrize> {
  const { data } = await axiosInstance.post<unknown>(
    "/admin/prizes",
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
  const inner = extractResponseData(data);
  return normalizeAdminPrize(inner);
}

/**
 * `GET /admin/prize-config/:campaignId` — returns `null` when no config exists (404).
 */
export async function getPrizeConfigByCampaignId(
  campaignId: string,
  accessToken?: string | null
): Promise<PrizeConfigFromApi | null> {
  try {
    const { data } = await axiosInstance.get<unknown>(
      `/admin/prize-config/${encodeURIComponent(campaignId)}`,
      {
        headers: authHeaders(accessToken),
      }
    );
    return normalizePrizeConfigFromBody(data, campaignId);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * Backend JSON often uses `number` for numeric IDs; UUIDs stay as strings.
 */
function wireId(id: string): string | number {
  if (/^\d+$/.test(id)) {
    const n = Number(id);
    if (Number.isSafeInteger(n)) return n;
  }
  return id;
}

/**
 * Body for `POST {{baseUrl}}/admin/prize-config`
 *
 * ```json
 * {
 *   "campaignId": "...",
 *   "mappings": [{ "productId": "...", "prizeId": "..." }],
 *   "inventory": [{ "prizeId": "...", "stock": 50 }],
 *   "distributionLimits": { "maxPerDay": 10, "maxPerUser": 1, "totalLimit": 100 }
 * }
 * ```
 */
function buildPrizeConfigPostBody(payload: SavePrizeConfigPayload) {
  const { campaignId, mappings, inventory, distributionLimits } = payload;
  return {
    campaignId: wireId(campaignId),
    mappings: mappings.map((m) => ({
      productId: wireId(m.productId),
      prizeId: wireId(m.prizeId),
    })),
    inventory: inventory.map((row) => ({
      prizeId: wireId(row.prizeId),
      stock: Number(row.stock),
    })),
    distributionLimits: {
      maxPerDay: Number(distributionLimits.maxPerDay),
      maxPerUser: Number(distributionLimits.maxPerUser),
      totalLimit: Number(distributionLimits.totalLimit),
    },
  };
}

/** `POST /admin/prize-config` — create or update full prize configuration. */
export async function savePrizeConfig(
  payload: SavePrizeConfigPayload,
  accessToken?: string | null
): Promise<void> {
  const body = buildPrizeConfigPostBody(payload);
  await axiosInstance.post("/admin/prize-config", body, {
    headers: authHeaders(accessToken),
  });
}
