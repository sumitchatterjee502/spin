"use client";

type TransactionStatusBadgeProps = {
  isLocked: boolean;
};

export default function TransactionStatusBadge({ isLocked }: TransactionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isLocked ? "bg-slate-900 text-white" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {isLocked ? "Locked" : "Unlocked"}
    </span>
  );
}
