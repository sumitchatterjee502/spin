"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DynamicTableContent, {
  type DynamicTableHeaderColumn,
  type DynamicTableRowActionKind,
} from "@/components/Slice/UI/DynamicTableContent";
import { listCampaignsPaginated } from "@/services/campaign.service";
import type { Campaign, CampaignStatus } from "@/types/campaign.types";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { formatCampaignDate } from "@/utils/formatCampaignDate";

const CAMPAIGN_TABLE_HEADER: DynamicTableHeaderColumn[] = [
  { key: "id", label: "ID", width: "88px" },
  { key: "name", label: "Name", width: "240px" },
  { key: "startDate", label: "Start", width: "120px" },
  { key: "endDate", label: "End", width: "120px" },
  { key: "status", label: "Status", width: "140px" },
  { key: "productNames", label: "Products", width: "100px" },
  { key: "createdAt", label: "Created", width: "120px" },
  { key: "action", label: "Actions", width: "120px" },
];

const CAMPAIGN_ROW_ACTIONS: DynamicTableRowActionKind[] = ["edit"];

type CampaignsTableProps = {
  refreshKey?: number;
};

export default function CampaignsTable({ refreshKey = 0 }: CampaignsTableProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CampaignStatus>("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await listCampaignsPaginated(
          {
            page: currentPage,
            limit: pageSize,
            search: debouncedSearch || undefined,
            status: statusFilter,
          },
          session?.accessToken
        );
        if (!cancelled) {
          setCampaigns(res.campaigns);
          setTotal(res.total);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(getCampaignApiErrorMessage(e, "Failed to load campaigns."));
          setCampaigns([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    status,
    session?.accessToken,
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter,
    refreshKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = startIndex + campaigns.length;

  const rowData = useMemo(
    () =>
      campaigns.map(
        (c) =>
          ({
            id: c.id,
            name: c.name,
            startDate: formatCampaignDate(c.startDate),
            endDate: formatCampaignDate(c.endDate),
            status: c.status,
            productIds: c.products?.map((p) => p.id) ?? [],
            productNames: c.products?.map((p) => p.name) ?? [],
            createdAt: c.createdAt ?? null,
            action: "",
          }) as unknown as Record<string, unknown>
      ),
    [campaigns]
  );

  const filteredPlaceholder = useMemo(
    () => rowData as Record<string, unknown>[],
    [rowData]
  );

  const handleSelectAll = useCallback((_e: ChangeEvent<HTMLInputElement>) => {}, []);
  const handleSelectItem = useCallback((_id: number) => {}, []);
  const selectedItems: number[] = [];

  const goToEdit = useCallback(
    (id: number) => {
      router.push(`/campaigns-setup/${id}/edit`);
    },
    [router]
  );

  const busy = status === "loading" || loading;

  const getStatusColor = useCallback((s: string) => {
    if (s === "ACTIVE") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }
    return "border-slate-200 bg-slate-100 text-slate-700";
  }, []);

  if (status === "unauthenticated") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        Sign in to view campaigns.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="campaigns-table-search"
              className="block text-xs font-medium text-slate-600"
            >
              Search
            </label>
            <input
              id="campaigns-table-search"
              type="search"
              placeholder="Search by name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="campaigns-table-status"
              className="block text-xs font-medium text-slate-600"
            >
              Status
            </label>
            <select
              id="campaigns-table-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {busy ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-700">No campaigns match your filters.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing search or changing status.
          </p>
        </div>
      ) : (
        <DynamicTableContent
          tableHeader={CAMPAIGN_TABLE_HEADER}
          currentData={rowData}
          filteredData={filteredPlaceholder}
          totalEntryCount={total}
          selectedItems={selectedItems}
          handleSelectAll={handleSelectAll}
          handleSelectItem={handleSelectItem}
          itemsPerPage={pageSize}
          setItemsPerPage={setPageSize}
          currentPage={safePage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          getStatusColor={getStatusColor}
          showUpdateAdminForm={goToEdit}
          visibleRowActions={CAMPAIGN_ROW_ACTIONS}
        />
      )}
    </div>
  );
}
