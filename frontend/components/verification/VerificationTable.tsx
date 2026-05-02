"use client";

import StatusBadge from "./StatusBadge";
import type { VerificationEntry } from "@/types/verification.types";

type VerificationTableProps = {
  entries: VerificationEntry[];
  loading: boolean;
  onViewReceipt: (entry: VerificationEntry) => void;
  onAction: (entry: VerificationEntry, action: "APPROVE" | "REJECT") => void;
  processingId?: number | null;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

export default function VerificationTable({
  entries,
  loading,
  onViewReceipt,
  onAction,
  processingId = null,
}: VerificationTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Prize</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Store</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Receipt</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Loading entries...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  No entries found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{entry.name || "N/A"}</div>
                    <div className="text-xs text-slate-500">{entry.email || "N/A"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{entry.phone || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.prizeName || "Winner Prize"}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.shopLocation || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.receiptNumber || "N/A"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(entry.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(entry)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View Receipt
                      </button>
                      <button
                        type="button"
                        disabled={entry.status !== "PENDING" || processingId === entry.id}
                        onClick={() => onAction(entry, "APPROVE")}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={entry.status !== "PENDING" || processingId === entry.id}
                        onClick={() => onAction(entry, "REJECT")}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
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
