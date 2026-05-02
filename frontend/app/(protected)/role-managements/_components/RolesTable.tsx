"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import DynamicTableContent, {
  type DynamicTableHeaderColumn,
} from "@/components/Slice/UI/DynamicTableContent";
import { getRoles } from "@/lib/api/RolesManagement";
import type { RbacRole } from "@/types/rbac.types";
import DataTableHeaderActions from "@/components/Slice/UI/DataTableHeaderActions";
import AddRoleModal from "./AddRoleModal";
import AssignRolePermissionsModal from "./AssignRolePermissionsModal";

const ROLE_TABLE_HEADER: DynamicTableHeaderColumn[] = [
  { key: "id", label: "ID", width: "88px" },
  { key: "name", label: "Name", width: "220px" },
  { key: "description", label: "Description" },
  { key: "permissions", label: "Permissions" },
  { key: "action", label: "Actions", width: "300px" },
];

function rolesLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to load roles."
    );
  }
  return error instanceof Error ? error.message : "Failed to load roles.";
}

type RolesTableProps = {
  refreshKey?: number;
};

export default function RolesTable({ refreshKey = 0 }: RolesTableProps) {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [rolesRefreshKey, setRolesRefreshKey] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [assignRole, setAssignRole] = useState<RbacRole | null>(null);

  const canViewRole = useMemo(() => session?.permissions?.includes("role-management:read"), [session?.permissions]);
  const canEditRole = useMemo(() => session?.permissions?.includes("role-management:update"), [session?.permissions]);
  const canDeleteRole = useMemo(() => session?.permissions?.includes("role-management:delete"), [session?.permissions]);
  const canAssignRole = useMemo(() => session?.permissions?.includes("role-management:assign"), [session?.permissions]);

  const handleRoleCreated = useCallback(() => {
    setRolesRefreshKey((k) => k + 1);
  }, []);

  const openAssignPermissions = useCallback((id: number) => {
    const role = roles.find((r) => r.id === id);
    if (role) {
      setAssignRole(role);
    }
  }, [roles]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getRoles(session?.accessToken);
        if (!cancelled) {
          setRoles(data);
          const idSet = new Set(data.map((r) => r.id));
          setSelectedIds((prev) => prev.filter((id) => idSet.has(id)));
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(rolesLoadErrorMessage(e));
          setRoles([]);
          setSelectedIds([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, refreshKey, rolesRefreshKey]);

  const totalItems = roles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRoles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return roles.slice(start, start + pageSize);
  }, [roles, safePage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = startIndex + paginatedRoles.length;

  const handleSelectItem = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      const pageIds = paginatedRoles.map((r) => r.id);
      if (checked) {
        setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
      } else {
        setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      }
    },
    [paginatedRoles]
  );

  const rowData = useMemo(
    () => paginatedRoles as unknown as Record<string, unknown>[],
    [paginatedRoles]
  );

  const filteredData = useMemo(
    () => roles as unknown as Record<string, unknown>[],
    [roles]
  );

  const busy = status === "loading" || loading;

  const roleAction = useCallback((label: string) => {
    return (id: number) => {
      const role = roles.find((r) => r.id === id);
      toast.message(`${label}: ${role?.name ?? id}`);
    };
  }, [roles]);

  return (
    <>
      <DataTableHeaderActions
        selectedItems={selectedIds}
        setShowAddModal={setShowAddModal}
        title=""
        description=""
        exportButton={false}
        addButtonText="Add Role"
      />

      {busy ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      ) : roles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-700">No roles returned</p>
          <p className="mt-1 text-sm text-slate-500">
            The RBAC service did not return any roles, or you may lack access.
          </p>
        </div>
      ) : (
        <DynamicTableContent
          tableHeader={ROLE_TABLE_HEADER}
          currentData={rowData}
          filteredData={filteredData}
          selectedItems={selectedIds}
          handleSelectAll={handleSelectAll}
          handleSelectItem={handleSelectItem}
          showRowSelection
          itemsPerPage={pageSize}
          setItemsPerPage={setPageSize}
          currentPage={safePage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          showViewAdminForm={canViewRole ? roleAction("View") : undefined}
          showUpdateAdminForm={canEditRole ? roleAction("Edit") : undefined}
          showDeleteAdminForm={canDeleteRole ? roleAction("Delete") : undefined}
          showActivateRole={roleAction("Activate")}
          showDeactivateRole={roleAction("Deactivate")}
          showAssignRole={canAssignRole ? openAssignPermissions : undefined}
        />
      )}

      <AssignRolePermissionsModal
        open={assignRole != null}
        role={assignRole}
        onClose={() => setAssignRole(null)}
        onSuccess={handleRoleCreated}
      />

      <AddRoleModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleRoleCreated}
      />
    </>
  );
}
