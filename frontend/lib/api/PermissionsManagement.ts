import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type { RbacPermission } from "@/types/rbac.types";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function mapPermissionRow(raw: unknown): RbacPermission {
  const p = raw as Record<string, unknown>;
  const key =
    typeof p.permissionKey === "string"
      ? p.permissionKey
      : String(p.key ?? "");
  return {
    id: Number(p.id),
    key,
    description: String(p.description ?? key ?? ""),
  };
}

export async function getPermissions(
  accessToken?: string | null
): Promise<RbacPermission[]> {
  const { data } = await axiosInstance.get<unknown>("/rbac/permissions", {
    headers: authHeaders(accessToken),
  });
  const inner = extractResponseData<unknown>(data);
  if (!Array.isArray(inner)) {
    return [];
  }
  return inner.map((item) => mapPermissionRow(item));
}

export type CreatePermissionPayload = {
  permissionKey: string;
  description: string;
};

export async function createPermission(
  payload: CreatePermissionPayload,
  accessToken?: string | null
): Promise<RbacPermission | null> {
  const { data } = await axiosInstance.post<unknown>(
    "/rbac/permissions",
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
  const inner = extractResponseData(data);
  if (inner != null && typeof inner === "object") {
    return mapPermissionRow(inner);
  }
  return null;
}

export async function deletePermission(
  permissionId: number,
  accessToken?: string | null
): Promise<void> {
  await axiosInstance.delete(`/rbac/permissions/${permissionId}`, {
    headers: authHeaders(accessToken),
  });
}
