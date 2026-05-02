"use client";

import type { InvoiceFilters as InvoiceFiltersType } from "@/types/invoice.types";

type InvoiceFiltersProps = {
  value: InvoiceFiltersType;
  onChange: (next: InvoiceFiltersType) => void;
  onApply: () => void;
  onReset: () => void;
  applying?: boolean;
  disabled?: boolean;
};

export default function InvoiceFilters({
  value,
  onChange,
  onApply,
  onReset,
  applying = false,
  disabled = false,
}: InvoiceFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="invoice-status" className="block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id="invoice-status"
            value={value.status ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...value,
                status: e.target.value as InvoiceFiltersType["status"],
                page: 1,
              })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div>
          <label htmlFor="invoice-store-location" className="block text-xs font-medium text-slate-600">
            Store location
          </label>
          <input
            id="invoice-store-location"
            type="text"
            value={value.storeLocation ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, storeLocation: e.target.value, page: 1 })}
            placeholder="e.g. Kolkata"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="invoice-search" className="block text-xs font-medium text-slate-600">
            Search
          </label>
          <input
            id="invoice-search"
            type="text"
            value={value.search ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
            placeholder="Name, phone, or invoice number"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={applying || disabled}
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
