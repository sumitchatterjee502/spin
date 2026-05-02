"use client";

import type { SlaStatus } from "@/types/fulfillment.types";

const slaStyles: Record<SlaStatus, string> = {
  WITHIN_SLA: "bg-emerald-100 text-emerald-800",
  BREACHED: "bg-rose-100 text-rose-800",
  NOT_STARTED: "bg-slate-100 text-slate-700",
};

export default function SlaBadge({ status }: { status: SlaStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${slaStyles[status]}`}>
      {status}
    </span>
  );
}
