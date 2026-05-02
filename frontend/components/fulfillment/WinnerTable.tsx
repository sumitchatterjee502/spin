"use client";

import SLAIndicator from "@/components/fulfillment/SLAIndicator";
import TransactionStatusBadge from "@/components/fulfillment/TransactionStatusBadge";
import type { WinnerEntry } from "@/types/fulfillment.types";

type WinnerTableProps = {
  winners: WinnerEntry[];
  loading: boolean;
  actionLoadingId: number | null;
  onViewDetails: (winner: WinnerEntry) => void;
  onConfirm: (winner: WinnerEntry) => void;
  onDispatch: (winner: WinnerEntry) => void;
};

function statusClass(status: WinnerEntry["status"]): string {
  if (status === "DELIVERED") return "bg-emerald-100 text-emerald-700";
  if (status === "DISPATCHED") return "bg-indigo-100 text-indigo-700";
  if (status === "CONFIRMED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function WinnerTable({
  winners,
  loading,
  actionLoadingId,
  onViewDetails,
  onConfirm,
  onDispatch,
}: WinnerTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Prize</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">SLA</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Dispatch</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                    Loading winners...
                  </span>
                </td>
              </tr>
            ) : winners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No winners found
                </td>
              </tr>
            ) : (
              winners.map((winner) => {
                const isActionLoading = actionLoadingId === winner.participationId;
                const canConfirm = winner.status === "APPROVED" && !winner.isLocked;
                const canDispatch = winner.status === "CONFIRMED" || winner.status === "DISPATCHED";

                return (
                  <tr key={winner.participationId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{winner.name || "N/A"}</div>
                      <div className="text-xs text-slate-500">{winner.email || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{winner.prizeName || "N/A"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{winner.invoiceNumber || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(winner.status)}`}>
                          {winner.status}
                        </span>
                        <TransactionStatusBadge isLocked={winner.isLocked} />
                        {winner.emailSent ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            Email Sent
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SLAIndicator verifiedAt={winner.verifiedAt} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{winner.dispatchDate ? winner.dispatchDate.slice(0, 10) : "Pending"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails(winner)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirm(winner)}
                          disabled={!canConfirm || isActionLoading}
                          className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Confirm Winner
                        </button>
                        <button
                          type="button"
                          onClick={() => onDispatch(winner)}
                          disabled={!canDispatch || isActionLoading}
                          className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Dispatch
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
