"use client";

import InvoiceStatusBadge from "@/components/invoice/InvoiceStatusBadge";
import type { InvoiceEntry, InvoiceStatus } from "@/types/invoice.types";

type InvoiceDetailsModalProps = {
  entry: InvoiceEntry | null;
  onClose: () => void;
};

const timelineOrder: InvoiceStatus[] = ["APPROVED", "PROCESSING", "DISPATCHED", "DELIVERED"];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

export default function InvoiceDetailsModal({ entry, onClose }: InvoiceDetailsModalProps) {
  if (!entry) return null;

  const activeIndex = timelineOrder.indexOf(entry.status);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Invoice Details</h3>
            <p className="mt-1 text-sm text-slate-600">Track invoice and fulfillment lifecycle for this winner.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p><span className="font-semibold text-slate-800">Name:</span> {entry.name || "N/A"}</p>
          <p><span className="font-semibold text-slate-800">Phone:</span> {entry.phone || "N/A"}</p>
          <p><span className="font-semibold text-slate-800">Email:</span> {entry.email || "N/A"}</p>
          <p><span className="font-semibold text-slate-800">Store:</span> {entry.shopLocation || "N/A"}</p>
          <p><span className="font-semibold text-slate-800">Prize:</span> {entry.prizeName || "N/A"}</p>
          <p><span className="font-semibold text-slate-800">Invoice:</span> {entry.invoiceNumber || "N/A"}</p>
          <p><span className="font-semibold text-slate-800">Verified at:</span> {formatDateTime(entry.verifiedAt)}</p>
          <p><span className="font-semibold text-slate-800">Last updated:</span> {formatDateTime(entry.updatedAt)}</p>
          <p className="sm:col-span-2">
            <span className="mr-2 font-semibold text-slate-800">Current status:</span>
            <InvoiceStatusBadge status={entry.status} />
          </p>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-semibold text-slate-800">Status Timeline</h4>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {timelineOrder.map((step, index) => {
              const completed = activeIndex >= index;
              return (
                <div
                  key={step}
                  className={`rounded-md border px-3 py-2 text-center text-xs font-semibold ${
                    completed
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
