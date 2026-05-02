"use client";

import { memo } from "react";
import FulfillmentStatusBadge from "@/components/fulfillment/FulfillmentStatusBadge";
import SlaBadge from "@/components/fulfillment/SlaBadge";
import type { FulfillmentEntry } from "@/types/fulfillment.types";

type Props = {
  rows: FulfillmentEntry[];
  loading: boolean;
  actionLoadingId: number | null;
  onConfirm: (entry: FulfillmentEntry) => void;
  onDispatch: (entry: FulfillmentEntry) => void;
  onDeliver: (entry: FulfillmentEntry) => void;
};

function formatDate(value: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function FulfillmentTableComponent({ rows, loading, actionLoadingId, onConfirm, onDispatch, onDeliver }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1500px] w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Participation ID",
                "Name",
                "Prize",
                "Invoice Number",
                "Status",
                "SLA Status",
                "Address",
                "Tracking ID",
                "Delivery Partner",
                "Confirmed At",
                "Dispatch Date",
                "Delivery Date",
                "Updated At",
                "Actions",
              ].map((column) => (
                <th key={column} className="px-3 py-3 text-left font-semibold text-slate-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              [...Array(6)].map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td colSpan={14} className="px-3 py-3">
                    <div className="h-8 animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-slate-500">
                  No fulfillment records found
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isMutating = actionLoadingId === row.participationId;
                const canConfirm = row.status === "APPROVED" && !row.isLocked;
                const canDispatch = row.status === "CONFIRMED";
                const canDeliver = row.status === "DISPATCHED";
                return (
                  <tr key={row.participationId} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{row.participationId}</td>
                    <td className="px-3 py-3 text-slate-700">{row.name || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{row.prize || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{row.invoiceNumber || "-"}</td>
                    <td className="px-3 py-3">
                      <FulfillmentStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-3">
                      <SlaBadge status={row.slaStatus} />
                    </td>
                    <td className="px-3 py-3 text-slate-700">{row.address || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{row.trackingId || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{row.deliveryPartner || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(row.confirmedAt)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(row.dispatchDate)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(row.deliveryDate)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(row.updatedAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {row.status === "APPROVED" ? (
                          <button
                            type="button"
                            onClick={() => onConfirm(row)}
                            disabled={!canConfirm || isMutating}
                            className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 disabled:opacity-50"
                          >
                            Confirm Winner
                          </button>
                        ) : null}
                        {row.status === "CONFIRMED" ? (
                          <button
                            type="button"
                            onClick={() => onDispatch(row)}
                            disabled={!canDispatch || isMutating}
                            className="rounded-md border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700 disabled:opacity-50"
                          >
                            Dispatch Prize
                          </button>
                        ) : null}
                        {row.status === "DISPATCHED" ? (
                          <button
                            type="button"
                            onClick={() => onDeliver(row)}
                            disabled={!canDeliver || isMutating}
                            className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 disabled:opacity-50"
                          >
                            Mark Delivered
                          </button>
                        ) : null}
                        {row.status === "DELIVERED" ? <span className="text-xs text-slate-400">No actions</span> : null}
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

const FulfillmentTable = memo(FulfillmentTableComponent);
export default FulfillmentTable;
