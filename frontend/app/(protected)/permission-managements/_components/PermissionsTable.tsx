"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import DynamicTableContent, {
  type DynamicTableHeaderColumn,
  type DynamicTableRowActionKind,
} from "@/components/Slice/UI/DynamicTableContent";
import { deletePermission, getPermissions } from "@/lib/api/PermissionsManagement";
import type { RbacPermission } from "@/types/rbac.types";
import DataTableHeaderActions from "@/components/Slice/UI/DataTableHeaderActions";
import ConfirmPopup from "@/components/Slice/popup/ConfirmPopup";
import AddPermissionModal from "./AddPermissionModal";

const PERMISSION_TABLE_HEADER: DynamicTableHeaderColumn[] = [
  { key: "id", label: "ID", width: "80px" },
  { key: "key", label: "Permission key", width: "240px" },
  { key: "description", label: "Description" },
  { key: "action", label: "Actions", width: "240px" },
];

const VISIBLE_PERMISSION_ACTIONS: DynamicTableRowActionKind[] = [
  "view",
  "edit",
  "delete",
];

function permissionsLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to load permissions."
    );
  }
  return error instanceof Error ? error.message : "Failed to load permissions.";
}

function deletePermissionErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to delete permission."
    );
  }
  return error instanceof Error ? error.message : "Failed to delete permission.";
}

type PermissionsTableProps = {
  refreshKey?: number;
};

export default function PermissionsTable({ refreshKey = 0 }: PermissionsTableProps) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<RbacPermission[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteTarget, setDeleteTarget] = useState<RbacPermission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteInFlightRef = useRef(false);

  const canViewPermission = useMemo(() => session?.permissions?.includes("permission-management:read"), [session?.permissions]);
  const canEditPermission = useMemo(() => session?.permissions?.includes("permission-management:update"), [session?.permissions]);
  const canDeletePermission = useMemo(() => session?.permissions?.includes("permission-management:delete"), [session?.permissions]);

  const handlePermissionCreated = useCallback(() => {
    setListRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getPermissions(session?.accessToken);
        if (!cancelled) {
          setPermissions(
            [...data].sort((a, b) => a.key.localeCompare(b.key))
          );
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(permissionsLoadErrorMessage(e));
          setPermissions([]);
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
  }, [status, session, refreshKey, listRefreshKey]);

  const totalItems = permissions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return permissions.slice(start, start + pageSize);
  }, [permissions, safePage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = startIndex + paginatedRows.length;

  const handleSelectAll = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    void e;
  }, []);
  const handleSelectItem = useCallback((id: number) => {
    void id;
  }, []);

  const rowData = useMemo(
    () => paginatedRows as unknown as Record<string, unknown>[],
    [paginatedRows]
  );

  const filteredData = useMemo(
    () => permissions as unknown as Record<string, unknown>[],
    [permissions]
  );

  const busy = status === "loading" || loading;

  const permissionCrudAction = useCallback(
    (label: string) => (id: number) => {
      const p = permissions.find((x) => x.id === id);
      toast.message(`${label}: ${p?.key ?? id}`);
    },
    [permissions]
  );

  const requestDeletePermission = useCallback((id: number) => {
    const p = permissions.find((x) => x.id === id);
    if (p) {
      setDeleteTarget(p);
    }
  }, [permissions]);

  const cancelDeletePermission = useCallback(() => {
    if (!deleting) {
      setDeleteTarget(null);
    }
  }, [deleting]);

  const confirmDeletePermission = useCallback(async () => {
    if (!deleteTarget || deleteInFlightRef.current) {
      return;
    }
    deleteInFlightRef.current = true;
    setDeleting(true);
    try {
      await deletePermission(deleteTarget.id, session?.accessToken);
      toast.success("Permission deleted.");
      setDeleteTarget(null);
      setListRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(deletePermissionErrorMessage(e));
    } finally {
      deleteInFlightRef.current = false;
      setDeleting(false);
    }
  }, [deleteTarget, session]);

  return (
    <>
      <DataTableHeaderActions
        selectedItems={[]}
        setShowAddModal={setShowAddModal}
        title=""
        description=""
        exportButton={false}
        addButtonText="Add Permission"
      />

      {busy ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      ) : permissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-700">No permissions returned</p>
          <p className="mt-1 text-sm text-slate-500">
            The RBAC service did not return any permissions, or you may lack access.
          </p>
        </div>
      ) : (
        <DynamicTableContent
          tableHeader={PERMISSION_TABLE_HEADER}
          currentData={rowData}
          filteredData={filteredData}
          selectedItems={[]}
          handleSelectAll={handleSelectAll}
          handleSelectItem={handleSelectItem}
          showRowSelection={false}
          itemsPerPage={pageSize}
          setItemsPerPage={setPageSize}
          currentPage={safePage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          visibleRowActions={VISIBLE_PERMISSION_ACTIONS}
          showViewAdminForm={canViewPermission ? permissionCrudAction("View") : undefined}
          showUpdateAdminForm={canEditPermission ? permissionCrudAction("Edit") : undefined}
          showDeleteAdminForm={canDeletePermission ? requestDeletePermission : undefined}
        />
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60]">
          <ConfirmPopup
            title="Delete permission"
            message={`Delete "${deleteTarget.key}"? This cannot be undone.`}
            onCancel={cancelDeletePermission}
            onConfirm={() => {
              void confirmDeletePermission();
            }}
          />
        </div>
      ) : null}

      <AddPermissionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handlePermissionCreated}
      />
    </>
  );
}
