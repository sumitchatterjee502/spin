"use client";

type SLAIndicatorProps = {
  verifiedAt: string;
};

function dayDiffFromToday(value: string): number | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function SLAIndicator({ verifiedAt }: SLAIndicatorProps) {
  const days = dayDiffFromToday(verifiedAt);
  if (days === null) return <span className="text-xs text-slate-500">N/A</span>;

  const breached = days > 5;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        breached ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {breached ? `Breached (${days}d)` : `Within SLA (${days}d)`}
    </span>
  );
}
