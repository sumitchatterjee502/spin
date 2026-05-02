"use client";

import type { FulfillmentFilters, FulfillmentStatus } from "@/types/fulfillment.types";

const statusOptions: Array<{ label: string; value: FulfillmentStatus | "" }> = [
  { label: "All statuses", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Delivered", value: "DELIVERED" },
];

type Props = {
  value: FulfillmentFilters;
  disabled?: boolean;
  onChange: (next: FulfillmentFilters) => void;
  onReset: () => void;
};

export default function FulfillmentFilters({ value, disabled, onChange, onReset }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          type="text"
          value={value.search ?? ""}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Search by name, invoice, tracking..."
          disabled={disabled}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100"
        />
        <select
          value={value.status ?? ""}
          onChange={(event) => onChange({ ...value, status: event.target.value as FulfillmentStatus | "", page: 1 })}
          disabled={disabled}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100"
        >
          {statusOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={value.storeLocation ?? ""}
          onChange={(event) => onChange({ ...value, storeLocation: event.target.value, page: 1 })}
          placeholder="Store location"
          disabled={disabled}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100"
        />
        <div className="flex gap-2">
          <select
            value={value.limit ?? 10}
            onChange={(event) => onChange({ ...value, limit: Number(event.target.value), page: 1 })}
            disabled={disabled}
            className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </section>
  );
}
