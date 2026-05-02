import type { Product } from "@/types/campaign.types";
import { extractResponseData } from "@/lib/api/standardResponse";
import axiosInstance from "@/utils/axiosInstance";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

export function normalizeProductRow(raw: unknown): Product {
  const p = raw as Record<string, unknown>;
  return {
    id: Number(p.id),
    name: String(p.name ?? ""),
  };
}

function normalizeProductsList(inner: unknown): Product[] {
  if (Array.isArray(inner)) {
    return inner.map(normalizeProductRow);
  }
  if (inner && typeof inner === "object" && "products" in inner) {
    const list = (inner as { products?: unknown }).products;
    if (Array.isArray(list)) {
      return list.map(normalizeProductRow);
    }
  }
  return [];
}

/**
 * List products. Optional `search` maps to `GET /products?search=...`.
 */
export async function listProducts(
  accessToken?: string | null,
  search?: string
): Promise<Product[]> {
  const q = search?.trim();
  const { data } = await axiosInstance.get<unknown>("/products", {
    params: q ? { search: q } : undefined,
    headers: authHeaders(accessToken),
  });
  const inner = extractResponseData<unknown>(data);
  return normalizeProductsList(inner);
}

/** @deprecated Prefer `listProducts` — kept for `ProductMultiSelect` and older imports. */
export async function getProducts(
  accessToken?: string | null
): Promise<Product[]> {
  return listProducts(accessToken, undefined);
}

export async function getProductById(
  id: number,
  accessToken?: string | null
): Promise<Product> {
  const { data } = await axiosInstance.get<unknown>(`/products/${id}`, {
    headers: authHeaders(accessToken),
  });
  return normalizeProductRow(extractResponseData(data));
}

export async function createProduct(
  payload: { name: string },
  accessToken?: string | null
): Promise<Product> {
  const { data } = await axiosInstance.post<unknown>("/products", payload, {
    headers: authHeaders(accessToken),
  });
  return normalizeProductRow(extractResponseData(data));
}

export async function updateProduct(
  id: number,
  payload: { name: string },
  accessToken?: string | null
): Promise<Product> {
  const { data } = await axiosInstance.patch<unknown>(
    `/products/${id}`,
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
  return normalizeProductRow(extractResponseData(data));
}

export async function deleteProduct(
  id: number,
  accessToken?: string | null
): Promise<void> {
  await axiosInstance.delete(`/products/${id}`, {
    headers: authHeaders(accessToken),
  });
}
