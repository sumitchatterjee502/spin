"use client";

import {
  useEffect,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  Eye,
  FileText,
  Package,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";

export type DynamicTableHeaderColumn = {
  label: string;
  key: string;
  width?: string;
};

export type DynamicTableRowActionKind =
  | "view"
  | "edit"
  | "delete"
  | "active"
  | "inactive"
  | "assign";

const DEFAULT_ROW_ACTIONS: DynamicTableRowActionKind[] = [
  "view",
  "edit",
  "delete",
  "active",
  "inactive",
  "assign",
];

export type DynamicTableContentProps = {
  tableHeader: DynamicTableHeaderColumn[];
  /** Current page rows (e.g. slice of RBAC roles). */
  currentData: Record<string, unknown>[];
  /** Full filtered list length / range source (same as roles list for client pagination). */
  filteredData: Record<string, unknown>[];
  selectedItems: number[];
  handleSelectAll: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSelectItem: (id: number) => void;
  /** When true, renders a leading checkbox column wired to the handlers above. */
  showRowSelection?: boolean;
  /**
   * Only used when a column key is `status`. Defaults avoid errors when you omit status columns
   * (e.g. RBAC roles).
   */
  getStatusIcon?: (status: string) => ReactNode;
  getStatusColor?: (status: string) => string;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  showViewAdminForm?: (id: number) => void;
  showUpdateAdminForm?: (id: number) => void;
  showDeleteAdminForm?: (id: number) => void;
  showActivateRole?: (id: number) => void;
  showDeactivateRole?: (id: number) => void;
  showAssignRole?: (id: number) => void;
  showInvoiceForm?: (id: number) => void;
  showPackingSlipForm?: (id: number) => void;
  /**
   * Which row action icons render in the `action` column. Defaults to all six
   * (view, edit, delete, activate, deactivate, assign).
   */
  visibleRowActions?: DynamicTableRowActionKind[];
  /**
   * When the table is backed by server-side pagination, set this to the API `total`
   * so the footer shows the correct range. If omitted, `filteredData.length` is used.
   */
  totalEntryCount?: number;
};

function getWidthStyle(
  tableHeader: DynamicTableHeaderColumn[],
  key: string
): CSSProperties | undefined {
  const headerConfig = tableHeader.find((h) => h.key === key);
  if (!headerConfig?.width) {
    return undefined;
  }
  const w = headerConfig.width;
  return { width: w, minWidth: w, maxWidth: w };
}

function SelectAllHeader({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      checked={checked}
      onChange={onChange}
      aria-label="Select all rows on this page"
    />
  );
}

function ActionIconButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

export default function DynamicTableContent({
  tableHeader,
  currentData,
  selectedItems,
  handleSelectAll,
  handleSelectItem,
  getStatusIcon = () => null,
  getStatusColor = () => "border-slate-200 bg-slate-50 text-slate-700",
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  filteredData,
  showRowSelection = false,
  showUpdateAdminForm,
  showDeleteAdminForm,
  showViewAdminForm,
  showInvoiceForm,
  showPackingSlipForm,
  showActivateRole,
  showDeactivateRole,
  showAssignRole,
  visibleRowActions,
  totalEntryCount,
}: DynamicTableContentProps) {
  const rowActionsToShow = visibleRowActions ?? DEFAULT_ROW_ACTIONS;

  const pageIds = currentData
    .map((row) => (row.id != null ? Number(row.id) : NaN))
    .filter((n) => Number.isFinite(n));
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedItems.includes(id));
  const somePageSelected =
    pageIds.some((id) => selectedItems.includes(id)) && !allPageSelected;

  const renderCell = (item: Record<string, unknown>, key: string) => {
    const value = item[key];
    const widthStyle = getWidthStyle(tableHeader, key);

    switch (key) {
      case "id":
        return (
          <td
            key={key}
            className="px-4 py-3 text-sm font-medium text-slate-900"
            style={widthStyle}
          >
            #{String(value ?? "")}
          </td>
        );

      case "key":
      case "permissionKey":
        return (
          <td
            key={key}
            className="px-4 py-3 font-mono text-sm text-slate-900"
            style={widthStyle}
          >
            {String(value ?? "")}
          </td>
        );

      case "name":
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                {String(value ?? "")
                  .split(/\s+/)
                  .map((n) => n[0] || "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "—"}
              </div>
              <span className="text-sm font-medium text-slate-900">{String(value ?? "")}</span>
            </div>
          </td>
        );

      case "image": {
        let imageUrl = "";
        if (typeof value === "string") {
          imageUrl = value;
        } else if (Array.isArray(value) && value.length > 0) {
          const first = value[0] as Record<string, unknown> | string;
          imageUrl =
            typeof first === "string"
              ? first
              : typeof first?.image === "string"
                ? first.image
                : "";
        }
        const base = process.env.NEXT_PUBLIC_API_URL ?? "";
        const src = imageUrl
          ? imageUrl.startsWith("http") || imageUrl.startsWith("data:")
            ? imageUrl
            : `${base.replace(/\/$/, "")}/${String(imageUrl).replace(/^\//, "")}`
          : "";
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            {src ? (
              <div className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={String(item.name ?? item.subCategoryName ?? "Image")}
                  className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='10'%3ENo img%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                No image
              </span>
            )}
          </td>
        );
      }

      case "role":
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
              {String(value ?? "")}
            </span>
          </td>
        );

      case "permissions": {
        const list = Array.isArray(value) ? value.map((p) => String(p)) : [];
        return (
          <td key={key} className="px-4 py-3 align-top" style={widthStyle}>
            <div className="max-w-xl">
              <p className="text-xs text-slate-500">
                {list.length} permission{list.length === 1 ? "" : "s"}
              </p>
              <p
                className="mt-1 line-clamp-2 text-xs text-slate-600"
                title={list.join(", ")}
              >
                {list.length ? list.join(", ") : "—"}
              </p>
            </div>
          </td>
        );
      }

      case "date":
      case "createdAt":
      case "updatedAt":
        return (
          <td key={key} className="px-4 py-3 text-sm text-slate-600" style={widthStyle}>
            {value
              ? new Date(String(value)).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </td>
        );

      case "status": {
        const s = String(value ?? "");
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusColor(s)}`}
            >
              {getStatusIcon(s)}
              <span>{s}</span>
            </span>
          </td>
        );
      }

      case "action": {
        const id = item?.id != null ? Number(item.id) : NaN;
        const valid = Number.isFinite(id);
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            <div className="flex flex-wrap items-center gap-1">
              {rowActionsToShow.includes("view") ? (
                <ActionIconButton
                  title={showViewAdminForm ? "View" : "View (no handler)"}
                  disabled={!valid || !showViewAdminForm}
                  onClick={() => valid && showViewAdminForm?.(id)}
                >
                  <Eye className="h-4 w-4 text-sky-600" />
                </ActionIconButton>
              ) : null}
              {rowActionsToShow.includes("edit") ? (
                <ActionIconButton
                  title={showUpdateAdminForm ? "Edit" : "Edit (no handler)"}
                  disabled={!valid || !showUpdateAdminForm}
                  onClick={() => valid && showUpdateAdminForm?.(id)}
                >
                  <Pencil className="h-4 w-4 text-emerald-600" />
                </ActionIconButton>
              ) : null}
              {rowActionsToShow.includes("delete") ? (
                <ActionIconButton
                  title={showDeleteAdminForm ? "Delete" : "Delete (no handler)"}
                  disabled={!valid || !showDeleteAdminForm}
                  onClick={() => valid && showDeleteAdminForm?.(id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </ActionIconButton>
              ) : null}
              {rowActionsToShow.includes("active") ? (
                <ActionIconButton
                  title={showActivateRole ? "Activate" : "Activate (no handler)"}
                  disabled={!valid || !showActivateRole}
                  onClick={() => valid && showActivateRole?.(id)}
                >
                  <CircleCheck className="h-4 w-4 text-slate-800" />
                </ActionIconButton>
              ) : null}
              {rowActionsToShow.includes("inactive") ? (
                <ActionIconButton
                  title={showDeactivateRole ? "Deactivate" : "Deactivate (no handler)"}
                  disabled={!valid || !showDeactivateRole}
                  onClick={() => valid && showDeactivateRole?.(id)}
                >
                  <CircleSlash className="h-4 w-4 text-amber-600" />
                </ActionIconButton>
              ) : null}
              {rowActionsToShow.includes("assign") ? (
                <ActionIconButton
                  title={showAssignRole ? "Assign" : "Assign (no handler)"}
                  disabled={!valid || !showAssignRole}
                  onClick={() => valid && showAssignRole?.(id)}
                >
                  <UserPlus className="h-4 w-4 text-violet-600" />
                </ActionIconButton>
              ) : null}
            </div>
          </td>
        );
      }

      case "invoice": {
        const show =
          item?.invoiceAvailable === true ||
          item?.statusCode === 4 ||
          String(item?.status ?? "").toLowerCase() === "completed";
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            {show ? (
              <button
                type="button"
                onClick={() => item?.id != null && showInvoiceForm?.(Number(item.id))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 transition-colors hover:bg-sky-100"
                title="View / Download Invoice"
              >
                <FileText className="h-4 w-4 text-sky-700" />
              </button>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
        );
      }

      case "packingSlip": {
        const show =
          item?.packingSlipAvailable === true ||
          item?.invoiceAvailable === true ||
          item?.statusCode === 4 ||
          String(item?.status ?? "").toLowerCase() === "completed";
        return (
          <td key={key} className="px-4 py-3" style={widthStyle}>
            {show ? (
              <button
                type="button"
                onClick={() => item?.id != null && showPackingSlipForm?.(Number(item.id))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 transition-colors hover:bg-emerald-100"
                title="View / Download Packing Slip"
              >
                <Package className="h-4 w-4 text-emerald-700" />
              </button>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
        );
      }

      default: {
        let text = "—";
        if (Array.isArray(value)) {
          text = value.map((v) => String(v)).join(", ");
        } else if (value !== null && value !== undefined) {
          text = String(value);
        }
        return (
          <td
            key={key}
            className="px-4 py-3 text-sm text-slate-600"
            style={widthStyle}
          >
            {text}
          </td>
        );
      }
    }
  };

  const total = totalEntryCount ?? filteredData.length;
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              {showRowSelection ? (
                <th scope="col" className="w-px whitespace-nowrap px-3 py-3">
                  <SelectAllHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              ) : null}
              {tableHeader.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className="px-4 py-3"
                  style={
                    header.width
                      ? {
                          width: header.width,
                          minWidth: header.width,
                          maxWidth: header.width,
                        }
                      : undefined
                  }
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.map((item, rowIndex) => {
              const row = item as Record<string, unknown>;
              const rowId = row.id != null ? Number(row.id) : rowIndex;
              const selected = Number.isFinite(rowId) && selectedItems.includes(rowId);
              return (
                <tr key={String(row.id ?? rowIndex)} className="hover:bg-slate-50/80">
                  {showRowSelection ? (
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        checked={selected}
                        onChange={() => Number.isFinite(rowId) && handleSelectItem(rowId)}
                        aria-label={`Select row ${String(row.id)}`}
                      />
                    </td>
                  ) : null}
                  {tableHeader.map((header) => renderCell(row, header.key))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap items-center gap-1 px-1">
            {[...Array(safeTotalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === safeTotalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={`ellipsis-${page}`} className="px-2 text-slate-400">
                    …
                  </span>
                );
              }
              return null;
            })}
          </div>
          <button
            type="button"
            onClick={() =>
              setCurrentPage(
                currentPage < safeTotalPages ? currentPage + 1 : safeTotalPages
              )
            }
            disabled={currentPage >= safeTotalPages}
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center sm:text-right">
          {total === 0 ? (
            <span>0 entries</span>
          ) : (
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, total)} of {total} entries
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
