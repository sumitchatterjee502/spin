"use client";

import type { InvoiceStatus } from "@/types/invoice.types";

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

const statusStyles: Record<InvoiceStatus, string> = {
  APPROVED: "border-yellow-200 bg-yellow-50 text-yellow-800",
  PROCESSING: "border-blue-200 bg-blue-50 text-blue-800",
  DISPATCHED: "border-violet-200 bg-violet-50 text-violet-800",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
