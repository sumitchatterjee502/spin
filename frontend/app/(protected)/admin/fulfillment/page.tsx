"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import ConfirmModal from "@/components/fulfillment/ConfirmModal";
import DeliverDialog from "@/components/fulfillment/DeliverDialog";
import DispatchModal from "@/components/fulfillment/DispatchModal";
import FulfillmentFilters from "@/components/fulfillment/FulfillmentFilters";
import FulfillmentTable from "@/components/fulfillment/FulfillmentTable";
import { useFulfillment } from "@/hooks/useFulfillment";
import { getFulfillmentById, getFulfillmentErrorMessage } from "@/services/fulfillment.service";
import { setAxiosBearerToken } from "@/utils/axiosInstance";
import type { FulfillmentEntry, FulfillmentFilters as FulfillmentFiltersType, FulfillmentStatus } from "@/types/fulfillment.types";

const defaultFilters: Required<FulfillmentFiltersType> = {
  status: "",
  storeLocation: "",
  search: "",
  page: 1,
  limit: 10,
};

export default function FulfillmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [searchInput, setSearchInput] = useState("");
  const [selectedRow, setSelectedRow] = useState<FulfillmentEntry | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [confirmPrefillLoading, setConfirmPrefillLoading] = useState(false);

  const filters = useMemo<Required<FulfillmentFiltersType>>(() => {
    const status = searchParams.get("status");
    const parsedStatus: FulfillmentStatus | "" =
      status === "APPROVED" || status === "CONFIRMED" || status === "DISPATCHED" || status === "DELIVERED"
        ? status
        : "";
    const page = Number(searchParams.get("page") ?? defaultFilters.page);
    const limit = Number(searchParams.get("limit") ?? defaultFilters.limit);
    return {
      status: parsedStatus,
      storeLocation: searchParams.get("storeLocation") ?? "",
      search: searchParams.get("search") ?? "",
      page: Number.isFinite(page) && page > 0 ? page : defaultFilters.page,
      limit: Number.isFinite(limit) && limit > 0 ? limit : defaultFilters.limit,
    };
  }, [searchParams]);

  const applyFiltersToUrl = useCallback(
    (next: Required<FulfillmentFiltersType>) => {
      const query = new URLSearchParams(searchParams.toString());
      const write = (key: string, value?: string | number) => {
        if (value === undefined || value === null || value === "") {
          query.delete(key);
          return;
        }
        query.set(key, String(value));
      };
      write("status", next.status);
      write("storeLocation", next.storeLocation);
      write("search", next.search);
      write("page", next.page);
      write("limit", next.limit);
      const nextUrl = query.toString() ? `${pathname}?${query.toString()}` : pathname;
      router.replace(nextUrl);
    },
    [pathname, router, searchParams]
  );

  const { listQuery, confirmMutation, dispatchMutation, deliverMutation } = useFulfillment(
    filters,
    session?.accessToken,
    status === "authenticated" && Boolean(session?.accessToken)
  );

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    setAxiosBearerToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if ((filters.search ?? "") === searchInput) return;
      applyFiltersToUrl({
        ...filters,
        search: searchInput.trim(),
        page: 1,
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [applyFiltersToUrl, filters, searchInput]);

  useEffect(() => {
    if (!listQuery.error) return;
    toast.error(getFulfillmentErrorMessage(listQuery.error));
  }, [listQuery.error]);

  const selectedResolved = useMemo(() => {
    if (!selectedRow) return null;
    return listQuery.data?.data.find((entry) => entry.participationId === selectedRow.participationId) ?? selectedRow;
  }, [listQuery.data?.data, selectedRow]);

  const total = listQuery.data?.meta.total ?? 0;
  const currentPage = filters.page ?? 1;
  const pageSize = filters.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const closeAllDialogs = () => {
    setConfirmModalOpen(false);
    setDispatchModalOpen(false);
    setDeliverDialogOpen(false);
    setConfirmPrefillLoading(false);
    setSelectedRow(null);
  };

  const onConfirmWinner = async (payload: { address: string; remarks: string }) => {
    if (!selectedResolved) return;
    if (selectedResolved.status !== "APPROVED") {
      toast.error("Only approved winners can be confirmed");
      return;
    }
    setActionLoadingId(selectedResolved.participationId);
    try {
      await confirmMutation.mutateAsync({ id: selectedResolved.participationId, payload });
      toast.success("Winner confirmed");
      closeAllDialogs();
    } catch (error) {
      toast.error(getFulfillmentErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  };

  const onOpenConfirm = async (entry: FulfillmentEntry) => {
    if (entry.status !== "APPROVED") return;
    setSelectedRow(entry);
    setConfirmModalOpen(true);
    setConfirmPrefillLoading(true);
    try {
      const fresh = await getFulfillmentById(entry.participationId, session?.accessToken);
      if (fresh) {
        setSelectedRow((prev) =>
          prev && prev.participationId === fresh.participationId ? fresh : prev
        );
      }
    } catch {
      // Keep modal usable with row data if detail endpoint fails.
    } finally {
      setConfirmPrefillLoading(false);
    }
  };

  const onDispatchWinner = async (payload: {
    dispatchDate: string;
    deliveryPartner?: string;
    trackingId?: string;
  }) => {
    if (!selectedResolved) return;
    if (selectedResolved.status !== "CONFIRMED") {
      toast.error("Only confirmed winners can be dispatched");
      return;
    }
    setActionLoadingId(selectedResolved.participationId);
    try {
      await dispatchMutation.mutateAsync({ id: selectedResolved.participationId, payload });
      toast.success("Prize dispatched");
      closeAllDialogs();
    } catch (error) {
      toast.error(getFulfillmentErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  };

  const onMarkDelivered = async () => {
    if (!selectedResolved) return;
    if (selectedResolved.status !== "DISPATCHED") {
      toast.error("Only dispatched prizes can be marked delivered");
      return;
    }
    setActionLoadingId(selectedResolved.participationId);
    try {
      await deliverMutation.mutateAsync(selectedResolved.participationId);
      toast.success("Marked as delivered");
      closeAllDialogs();
    } catch (error) {
      toast.error(getFulfillmentErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="Admin Fulfillment Dashboard" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in as admin to access fulfillment management.
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Admin Fulfillment Dashboard"
      description="Manage winner confirmation, prize dispatch, and final delivery updates."
    >
      <div className="space-y-4">
        <FulfillmentFilters
          value={{ ...filters, search: searchInput }}
          disabled={listQuery.isFetching}
          onChange={(next) => {
            if (next.search !== undefined && next.search !== filters.search) {
              setSearchInput(next.search);
              return;
            }
            applyFiltersToUrl({
              status: (next.status ?? "") as FulfillmentStatus | "",
              storeLocation: next.storeLocation ?? "",
              search: filters.search ?? "",
              page: next.page ?? 1,
              limit: next.limit ?? 10,
            });
          }}
          onReset={() => {
            setSearchInput("");
            applyFiltersToUrl(defaultFilters);
          }}
        />

        <FulfillmentTable
          rows={listQuery.data?.data ?? []}
          loading={listQuery.isLoading || status === "loading"}
          actionLoadingId={actionLoadingId}
          onConfirm={(entry) => {
            void onOpenConfirm(entry);
          }}
          onDispatch={(entry) => {
            if (entry.status !== "CONFIRMED") return;
            setSelectedRow(entry);
            setDispatchModalOpen(true);
          }}
          onDeliver={(entry) => {
            if (entry.status !== "DISPATCHED") return;
            setSelectedRow(entry);
            setDeliverDialogOpen(true);
          }}
        />

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || listQuery.isFetching}
            onClick={() => applyFiltersToUrl({ ...filters, page: Math.max(1, currentPage - 1) })}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages || listQuery.isFetching}
            onClick={() => applyFiltersToUrl({ ...filters, page: currentPage + 1 })}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmModalOpen}
        entry={selectedResolved}
        loading={confirmMutation.isPending || confirmPrefillLoading}
        onClose={closeAllDialogs}
        onSubmit={onConfirmWinner}
      />

      <DispatchModal
        open={dispatchModalOpen}
        entry={selectedResolved}
        loading={dispatchMutation.isPending}
        onClose={closeAllDialogs}
        onSubmit={onDispatchWinner}
      />

      <DeliverDialog
        open={deliverDialogOpen}
        loading={deliverMutation.isPending}
        onClose={closeAllDialogs}
        onConfirm={onMarkDelivered}
      />

    </DataTableContent>
  );
}
