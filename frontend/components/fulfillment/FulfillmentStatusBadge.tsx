"use client";

import type { FulfillmentStatus } from "@/types/fulfillment.types";

const statusStyles: Record<FulfillmentStatus, string> = {
  APPROVED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DISPATCHED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
};

export default function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
