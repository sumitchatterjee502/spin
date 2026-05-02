"use client";

import InvoiceStatusBadge from "@/components/invoice/InvoiceStatusBadge";
import type { InvoiceEntry } from "@/types/invoice.types";

type InvoiceTableProps = {
  invoices: InvoiceEntry[];
  loading: boolean;
  onViewDetails: (entry: InvoiceEntry) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

export default function InvoiceTable({ invoices, loading, onViewDetails }: InvoiceTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Prize</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Store</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                    Loading invoices...
                  </span>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((entry) => (
                <tr key={entry.participationId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{entry.name || "N/A"}</div>
                    <div className="text-xs text-slate-500">{entry.email || "N/A"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{entry.phone || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.prizeName || "N/A"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{entry.invoiceNumber || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.shopLocation || "N/A"}</td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(entry.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetails(entry)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
