"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import InvoiceDetailsModal from "@/components/invoice/InvoiceDetailsModal";
import InvoiceFilters from "@/components/invoice/InvoiceFilters";
import SummaryCards from "@/components/invoice/SummaryCards";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import { getInvoiceSummary, getInvoices, getInvoicesErrorMessage } from "@/services/invoice.service";
import type { InvoiceEntry, InvoiceFilters as InvoiceFiltersType, InvoiceSummary } from "@/types/invoice.types";

const defaultFilters: InvoiceFiltersType = {
  status: "",
  storeLocation: "",
  search: "",
  page: 1,
  limit: 10,
};

const emptySummary: InvoiceSummary = {
  approved: 0,
  processing: 0,
  dispatched: 0,
  delivered: 0,
};

export default function InvoiceValidationPage() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
  const [filters, setFilters] = useState<InvoiceFiltersType>(defaultFilters);
  const [searchInput, setSearchInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceEntry | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [summary, setSummary] = useState<InvoiceSummary>(emptySummary);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInvoices = useCallback(async (nextFilters: InvoiceFiltersType) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await getInvoices(nextFilters, accessToken);
      setInvoices(response.entries);
      setTotal(response.total);
    } catch (error) {
      setInvoices([]);
      setTotal(0);
      toast.error(getInvoicesErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadSummary = useCallback(async () => {
    if (!accessToken) return;
    setSummaryLoading(true);
    try {
      const response = await getInvoiceSummary(accessToken);
      setSummary(response);
    } catch (error) {
      setSummary(emptySummary);
      toast.error(getInvoicesErrorMessage(error));
    } finally {
      setSummaryLoading(false);
    }
  }, [accessToken]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    void loadSummary();
  }, [status, accessToken, loadSummary]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    void loadInvoices(filters);
  }, [status, accessToken, filters, loadInvoices]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const totalPages = useMemo(() => {
    const limit = filters.limit ?? 10;
    return Math.max(1, Math.ceil(total / limit));
  }, [filters.limit, total]);

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="Invoice Tracking Dashboard" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in as admin to access invoice tracking.
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Invoice Tracking Dashboard"
      description="Track approved winner invoices, fulfillment progress, and prize delivery lifecycle."
    >
      <div className="space-y-4">
        <InvoiceFilters
          value={{ ...filters, search: searchInput }}
          onChange={(next) => {
            const prevSearch = filters.search ?? "";
            const nextSearch = next.search ?? "";

            if (nextSearch !== prevSearch) {
              setSearchInput(nextSearch);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => {
                setFilters((prev) => ({ ...prev, search: nextSearch, page: 1 }));
              }, 300);
              return;
            }

            setFilters(next);
          }}
          onApply={() => {
            const sanitizedSearch = searchInput.trim();
            setFilters((prev) => ({ ...prev, search: sanitizedSearch, page: 1 }));
          }}
          onReset={() => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
            setSearchInput("");
            setFilters(defaultFilters);
            void Promise.all([loadSummary(), loadInvoices(defaultFilters)]);
          }}
          applying={loading || summaryLoading}
          disabled={loading || summaryLoading}
        />

        <SummaryCards summary={summary} />

        <InvoiceTable
          invoices={invoices}
          loading={loading || summaryLoading || status === "loading"}
          onViewDetails={setSelectedInvoice}
        />

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={loading || (filters.page ?? 1) <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {filters.page ?? 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || (filters.page ?? 1) >= totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <InvoiceDetailsModal entry={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </DataTableContent>
  );
}
