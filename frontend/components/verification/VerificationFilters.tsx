"use client";

import type { VerificationFilters } from "@/types/verification.types";

type VerificationFiltersProps = {
  value: VerificationFilters;
  onChange: (next: VerificationFilters) => void;
  onApply: () => void;
  onReset: () => void;
  applying?: boolean;
};

export default function VerificationFilters({
  value,
  onChange,
  onApply,
  onReset,
  applying = false,
}: VerificationFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="verification-search" className="block text-xs font-medium text-slate-600">
            Search
          </label>
          <input
            id="verification-search"
            type="text"
            value={value.search ?? ""}
            onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
            placeholder="Name, phone, or email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="verification-status" className="block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id="verification-status"
            value={value.status ?? ""}
            onChange={(e) => onChange({ ...value, status: e.target.value as VerificationFilters["status"], page: 1 })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label htmlFor="verification-store" className="block text-xs font-medium text-slate-600">
            Store location
          </label>
          <input
            id="verification-store"
            type="text"
            value={value.storeLocation ?? ""}
            onChange={(e) => onChange({ ...value, storeLocation: e.target.value, page: 1 })}
            placeholder="e.g. Kolkata"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="verification-from" className="block text-xs font-medium text-slate-600">
            From date
          </label>
          <input
            id="verification-from"
            type="date"
            value={value.fromDate ?? ""}
            onChange={(e) => onChange({ ...value, fromDate: e.target.value, page: 1 })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="verification-to" className="block text-xs font-medium text-slate-600">
            To date
          </label>
          <input
            id="verification-to"
            type="date"
            value={value.toDate ?? ""}
            onChange={(e) => onChange({ ...value, toDate: e.target.value, page: 1 })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="verification-sort-by" className="block text-xs font-medium text-slate-600">
            Sort by
          </label>
          <select
            id="verification-sort-by"
            value={value.sortBy ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                sortBy: (e.target.value || undefined) as VerificationFilters["sortBy"],
                page: 1,
              })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Created date</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="createdAt">Created date</option>
          </select>
        </div>

        <div>
          <label htmlFor="verification-sort-order" className="block text-xs font-medium text-slate-600">
            Sort order
          </label>
          <select
            id="verification-sort-order"
            value={value.sortOrder ?? "DESC"}
            onChange={(e) => onChange({ ...value, sortOrder: e.target.value as "ASC" | "DESC", page: 1 })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="DESC">Newest first</option>
            <option value="ASC">Oldest first</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
