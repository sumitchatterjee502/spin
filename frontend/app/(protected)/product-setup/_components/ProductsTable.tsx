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
import DataTableHeaderActions from "@/components/Slice/UI/DataTableHeaderActions";
import ConfirmPopup from "@/components/Slice/popup/ConfirmPopup";
import {
  deleteProduct,
  listProducts,
} from "@/services/product.service";
import type { Product } from "@/types/campaign.types";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import ViewProductModal from "./ViewProductModal";

const PRODUCT_TABLE_HEADER: DynamicTableHeaderColumn[] = [
  { key: "id", label: "ID", width: "88px" },
  { key: "name", label: "Name", width: "320px" },
  { key: "action", label: "Actions", width: "200px" },
];

const VISIBLE_PRODUCT_ACTIONS: DynamicTableRowActionKind[] = [
  "view",
  "edit",
  "delete",
];

function productsLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to load products."
    );
  }
  return error instanceof Error ? error.message : "Failed to load products.";
}

function deleteProductErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to delete product."
    );
  }
  return error instanceof Error ? error.message : "Failed to delete product.";
}

type ProductsTableProps = {
  refreshKey?: number;
};

export default function ProductsTable({ refreshKey = 0 }: ProductsTableProps) {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [viewProductId, setViewProductId] = useState<number | null>(null);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteInFlightRef = useRef(false);

  const { canView, canCreate, canUpdate, canDelete } = useMemo(() => {
    const perms = session?.permissions ?? [];
    const read = perms.includes("product-setup:read");
    return {
      canView: read,
      canCreate: read || perms.includes("product-setup:create"),
      canUpdate: read || perms.includes("product-setup:update"),
      canDelete: read || perms.includes("product-setup:delete"),
    };
  }, [session?.permissions]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleListRefresh = useCallback(() => {
    setListRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setProducts([]);
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listProducts(
          session?.accessToken,
          debouncedSearch || undefined
        );
        if (!cancelled) {
          setProducts([...data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(productsLoadErrorMessage(e));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken, debouncedSearch, refreshKey, listRefreshKey]);

  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, safePage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = startIndex + paginatedRows.length;

  const handleSelectAll = useCallback((_e: ChangeEvent<HTMLInputElement>) => {}, []);
  const handleSelectItem = useCallback((_id: number) => {}, []);

  const rowData = useMemo(
    () => paginatedRows as unknown as Record<string, unknown>[],
    [paginatedRows]
  );

  const filteredData = useMemo(
    () => products as unknown as Record<string, unknown>[],
    [products]
  );

  const busy = status === "loading" || loading;

  const closeViewModal = useCallback(() => setViewProductId(null), []);
  const closeEditModal = useCallback(() => setEditProductId(null), []);

  const cancelDelete = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id, session?.accessToken);
      toast.success("Product deleted.");
      setDeleteTarget(null);
      handleListRefresh();
    } catch (e) {
      toast.error(deleteProductErrorMessage(e));
    } finally {
      deleteInFlightRef.current = false;
      setDeleting(false);
    }
  }, [deleteTarget, session?.accessToken, handleListRefresh]);

  const showAddButton = canCreate;
  const showViewAction = canView;
  const showEditAction = canUpdate;
  const showDeleteAction = canDelete;

  return (
    <>
      <DataTableHeaderActions
        selectedItems={[]}
        setShowAddModal={showAddButton ? setShowAddModal : undefined}
        title=""
        description=""
        exportButton={false}
        addButtonText={showAddButton ? "Add product" : undefined}
      />

      <div className="mb-4 max-w-md">
        <label htmlFor="product-setup-search" className="block text-xs font-medium text-slate-600">
          Search
        </label>
        <input
          id="product-setup-search"
          type="search"
          placeholder="Search by name (API: ?search=…)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {busy ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-700">No products found</p>
          <p className="mt-1 text-sm text-slate-500">
            {debouncedSearch
              ? "Try a different search term."
              : "Create a product or adjust your filters."}
          </p>
        </div>
      ) : (
        <DynamicTableContent
          tableHeader={PRODUCT_TABLE_HEADER}
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
          visibleRowActions={VISIBLE_PRODUCT_ACTIONS}
          showViewAdminForm={showViewAction ? (id) => setViewProductId(id) : undefined}
          showUpdateAdminForm={showEditAction ? (id) => setEditProductId(id) : undefined}
          showDeleteAdminForm={
            showDeleteAction ? (id) => {
              const p = products.find((x) => x.id === id);
              if (p) setDeleteTarget(p);
            } : undefined
          }
        />
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60]">
          <ConfirmPopup
            title="Delete product"
            message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
            onCancel={cancelDelete}
            onConfirm={() => {
              void confirmDelete();
            }}
          />
        </div>
      ) : null}

      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleListRefresh}
      />

      <ViewProductModal
        open={viewProductId != null}
        productId={viewProductId}
        onClose={closeViewModal}
      />

      <EditProductModal
        open={editProductId != null}
        productId={editProductId}
        onClose={closeEditModal}
        onSuccess={handleListRefresh}
      />
    </>
  );
}
