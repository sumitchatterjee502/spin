"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import DynamicTableContent, {
  type DynamicTableHeaderColumn,
  type DynamicTableRowActionKind,
} from "@/components/Slice/UI/DynamicTableContent";
import { listLeads } from "@/services/lead-profile.service";
import type { LeadProfile } from "@/types/lead-profile.types";

const LEADS_TABLE_HEADER: DynamicTableHeaderColumn[] = [
  { key: "id", label: "ID", width: "88px" },
  { key: "name", label: "Name", width: "220px" },
  { key: "phone", label: "Phone", width: "140px" },
  { key: "email", label: "Email", width: "220px" },
  { key: "shopLocation", label: "Shop Location", width: "180px" },
  { key: "address", label: "Address", width: "220px" },
  { key: "campaignId", label: "Campaign ID", width: "120px" },
  { key: "image", label: "Receipt", width: "110px" },
  { key: "createdAt", label: "Created At", width: "140px" },
  { key: "action", label: "Actions", width: "90px" },
];

const VISIBLE_ROW_ACTIONS: DynamicTableRowActionKind[] = ["view"];

function leadsLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to load leads."
    );
  }
  return error instanceof Error ? error.message : "Failed to load leads.";
}

export default function LeadProfilesTable() {
  const { data: session, status } = useSession();

  const [rows, setRows] = useState<LeadProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignIdInput, setCampaignIdInput] = useState("");
  const [campaignIdFilter, setCampaignIdFilter] = useState<number | undefined>(undefined);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const trimmed = campaignIdInput.trim();
    if (!trimmed) {
      setCampaignIdFilter(undefined);
      setCurrentPage(1);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      setCampaignIdFilter(parsed);
      setCurrentPage(1);
    }
  }, [campaignIdInput]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await listLeads(
          {
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            campaignId: campaignIdFilter,
          },
          session?.accessToken
        );
        if (cancelled) return;
        setRows(result.items);
        setTotalItems(result.pagination.total);
      } catch (error) {
        if (cancelled) return;
        toast.error(leadsLoadErrorMessage(error));
        setRows([]);
        setTotalItems(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken, currentPage, pageSize, searchTerm, campaignIdFilter]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const rowData = useMemo(
    () =>
      rows.map((lead) => ({
        ...lead,
        image: lead.receipts[0]?.imageUrl ?? "",
      })) as unknown as Record<string, unknown>[],
    [rows]
  );

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = startIndex + rows.length;

  const handleSelectAll = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    void e;
  }, []);

  const handleSelectItem = useCallback((id: number) => {
    void id;
  }, []);

  const handleView = useCallback(
    (id: number) => {
      const lead = rows.find((row) => row.id === id);
      if (!lead) return;
      toast.message(
        `Lead ${lead.name} | Receipt: ${lead.receipts[0]?.receiptNumber ?? "N/A"}`
      );
    },
    [rows]
  );

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search lead name, phone, email..."
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
        <input
          type="number"
          min={1}
          value={campaignIdInput}
          onChange={(e) => setCampaignIdInput(e.target.value)}
          placeholder="Campaign ID"
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {loading && rows.length === 0 ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-700">No leads found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try updating search text or campaign filter.
          </p>
        </div>
      ) : (
        <DynamicTableContent
          tableHeader={LEADS_TABLE_HEADER}
          currentData={rowData}
          filteredData={rowData}
          selectedItems={[]}
          handleSelectAll={handleSelectAll}
          handleSelectItem={handleSelectItem}
          showRowSelection={false}
          itemsPerPage={pageSize}
          setItemsPerPage={setPageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalEntryCount={totalItems}
          visibleRowActions={VISIBLE_ROW_ACTIONS}
          showViewAdminForm={handleView}
        />
      )}
    </>
  );
}
