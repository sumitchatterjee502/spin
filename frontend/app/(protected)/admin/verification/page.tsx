"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import ReceiptPreviewModal from "@/components/verification/ReceiptPreviewModal";
import VerificationActionModal from "@/components/verification/VerificationActionModal";
import VerificationFilters from "@/components/verification/VerificationFilters";
import VerificationTable from "@/components/verification/VerificationTable";
import {
  getVerificationEntries,
  getVerificationErrorMessage,
  submitVerificationAction,
} from "@/services/verification.service";
import type {
  VerificationActionType,
  VerificationEntry,
  VerificationFilters as VerificationFiltersType,
} from "@/types/verification.types";

const defaultFilters: VerificationFiltersType = {
  status: "",
  search: "",
  storeLocation: "",
  fromDate: "",
  toDate: "",
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "DESC",
};

export default function AdminVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [entries, setEntries] = useState<VerificationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<VerificationEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<VerificationEntry | null>(null);
  const [actionType, setActionType] = useState<VerificationActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const filters = useMemo<VerificationFiltersType>(() => {
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const page = Number(searchParams.get("page") ?? defaultFilters.page);
    const limit = Number(searchParams.get("limit") ?? defaultFilters.limit);

    return {
      status:
        status === "PENDING" || status === "APPROVED" || status === "REJECTED"
          ? status
          : "",
      search: searchParams.get("search") ?? "",
      storeLocation: searchParams.get("storeLocation") ?? "",
      fromDate: searchParams.get("fromDate") ?? "",
      toDate: searchParams.get("toDate") ?? "",
      page: Number.isFinite(page) && page > 0 ? page : defaultFilters.page,
      limit: Number.isFinite(limit) && limit > 0 ? limit : defaultFilters.limit,
      sortBy:
        sortBy === "createdAt" || sortBy === "name" || sortBy === "status"
          ? sortBy
          : "createdAt",
      sortOrder: sortOrder === "ASC" ? "ASC" : "DESC",
    };
  }, [searchParams]);

  const applyFiltersToUrl = useCallback(
    (next: VerificationFiltersType) => {
      const query = new URLSearchParams(searchParams.toString());
      const write = (key: string, value?: string | number) => {
        if (value === undefined || value === null || value === "") {
          query.delete(key);
          return;
        }
        query.set(key, String(value));
      };
      write("status", next.status);
      write("search", next.search);
      write("storeLocation", next.storeLocation);
      write("fromDate", next.fromDate);
      write("toDate", next.toDate);
      write("page", next.page ?? 1);
      write("limit", next.limit ?? 10);
      write("sortBy", next.sortBy);
      write("sortOrder", next.sortOrder);
      router.replace(`/admin/verification?${query.toString()}`);
    },
    [router, searchParams]
  );

  const currentPage = filters.page ?? 1;
  const pageSize = filters.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadEntries = useCallback(async (signal?: AbortSignal) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await getVerificationEntries(filters, accessToken, signal);
      setEntries(res.entries);
      setTotal(res.total);
    } catch (error) {
      const message = getVerificationErrorMessage(error);
      if (!message) return;
      setEntries([]);
      setTotal(0);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    const controller = new AbortController();
    void loadEntries(controller.signal);
    return () => controller.abort();
  }, [status, accessToken, loadEntries]);

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if ((filters.search ?? "") === searchInput) return;
      applyFiltersToUrl({
        ...filters,
        search: searchInput,
        page: 1,
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput, filters, applyFiltersToUrl]);

  const handleReset = () => {
    setSearchInput("");
    applyFiltersToUrl(defaultFilters);
  };

  const handleOpenActionModal = (entry: VerificationEntry, action: VerificationActionType) => {
    if (entry.status !== "PENDING") {
      toast.error("Only pending entries can be verified.");
      return;
    }
    setSelectedEntry(entry);
    setActionType(action);
  };

  const handleSubmitAction = async ({
    invoiceNumber,
    remarks,
  }: {
    invoiceNumber: string;
    remarks: string;
  }) => {
    if (!accessToken || !selectedEntry || !actionType) return;
    setActionLoading(true);
    setProcessingId(selectedEntry.id);
    try {
      const updated = await submitVerificationAction(
        selectedEntry.id,
        actionType,
        remarks,
        actionType === "APPROVE" ? invoiceNumber : null,
        accessToken
      );
      const nextStatus = actionType === "APPROVE" ? "APPROVED" : "REJECTED";
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === selectedEntry.id
            ? {
                ...entry,
                status: updated?.status ?? nextStatus,
                remarks: remarks,
                invoiceNumber: actionType === "APPROVE" ? invoiceNumber : entry.invoiceNumber,
              }
            : entry
        )
      );
      toast.success(actionType === "APPROVE" ? "Approved successfully" : "Submission rejected");
      setSelectedEntry(null);
      setActionType(null);
      await loadEntries();
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="Verification dashboard" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in as admin to review verification entries.
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Verification dashboard"
      description="Review winning submissions only, validate receipts, and approve or reject with invoice and remarks."
    >
      <div className="space-y-4">
        <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Winners only
        </div>

        <VerificationFilters
          value={{ ...filters, search: searchInput }}
          onChange={(next) => {
            const shouldDebounce = next.search !== undefined && next.search !== filters.search;
            if (shouldDebounce) {
              setSearchInput(next.search ?? "");
            }
            const immediateNext = { ...next, search: shouldDebounce ? filters.search : next.search };
            applyFiltersToUrl(immediateNext);
          }}
          onApply={() => applyFiltersToUrl({ ...filters, search: searchInput, page: 1 })}
          onReset={handleReset}
          applying={loading}
        />

        <VerificationTable
          entries={entries}
          loading={loading || status === "loading"}
          onViewReceipt={setPreviewEntry}
          onAction={handleOpenActionModal}
          processingId={processingId}
        />

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() =>
              applyFiltersToUrl({
                ...filters,
                page: Math.max(1, (filters.page ?? 1) - 1),
              })
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages || loading}
            onClick={() =>
              applyFiltersToUrl({
                ...filters,
                page: (filters.page ?? 1) + 1,
              })
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <ReceiptPreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      <VerificationActionModal
        key={`${selectedEntry?.id ?? "none"}-${actionType ?? "none"}`}
        entry={selectedEntry}
        actionType={actionType}
        loading={actionLoading}
        onClose={() => {
          if (actionLoading) return;
          setSelectedEntry(null);
          setActionType(null);
        }}
        onSubmit={handleSubmitAction}
      />
    </DataTableContent>
  );
}
