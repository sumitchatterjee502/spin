"use client";

import type { InvoiceSummary } from "@/types/invoice.types";

type SummaryCardsProps = {
  summary: InvoiceSummary;
};

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Approved</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{summary.approved}</p>
      </article>
      <article className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Processing</p>
        <p className="mt-1 text-2xl font-bold text-blue-800">{summary.processing}</p>
      </article>
      <article className="rounded-lg border border-violet-200 bg-violet-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Dispatched</p>
        <p className="mt-1 text-2xl font-bold text-violet-800">{summary.dispatched}</p>
      </article>
      <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Delivered</p>
        <p className="mt-1 text-2xl font-bold text-emerald-800">{summary.delivered}</p>
      </article>
    </section>
  );
}
