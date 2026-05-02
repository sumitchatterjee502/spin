import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type { RbacRole } from "@/types/rbac.types";

export type CreateRolePayload = {
  name: string;
  description: string;
};

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function mapRoleRow(raw: unknown): RbacRole {
  const r = raw as Record<string, unknown>;
  const perms = r.permissions;
  return {
    id: Number(r.id),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    permissions: Array.isArray(perms) ? perms.map((p) => String(p)) : [],
  };
}

export async function getRoles(accessToken?: string | null): Promise<RbacRole[]> {
  const { data } = await axiosInstance.get<unknown>("/rbac/roles", {
    headers: authHeaders(accessToken),
  });
  const inner = extractResponseData<unknown>(data);
  if (!Array.isArray(inner)) {
    return [];
  }
  return inner.map((item) => mapRoleRow(item));
}

export async function createRole(
  payload: CreateRolePayload,
  accessToken?: string | null
): Promise<RbacRole> {
  const { data } = await axiosInstance.post<unknown>("/rbac/roles", payload, {
    headers: authHeaders(accessToken),
  });
  return mapRoleRow(extractResponseData(data));
}

export type AssignRolePermissionsPayload = {
  permissionKeys: string[];
};

/**
 * Sets the role’s permissions from `permissionKeys`. Uses POST; use put() if your API expects PUT.
 */
export async function assignRolePermissions(
  roleId: number,
  payload: AssignRolePermissionsPayload,
  accessToken?: string | null
): Promise<void> {
  await axiosInstance.post(
    `/rbac/roles/${roleId}/permissions`,
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
}
