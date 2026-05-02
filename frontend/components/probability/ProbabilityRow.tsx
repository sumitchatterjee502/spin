"use client";

export type ProbabilityRowProps = {
  outcome: string;
  weight: number;
  onWeightChange: (next: number) => void;
  disabled?: boolean;
  error?: string;
  /** Highlights the mandatory non-prize outcome row. */
  isLoseRow?: boolean;
};

export default function ProbabilityRow({
  outcome,
  weight,
  onWeightChange,
  disabled,
  error,
  isLoseRow,
}: ProbabilityRowProps) {
  return (
    <tr className={isLoseRow ? "bg-slate-50/80" : undefined}>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-900">{outcome}</span>
          {isLoseRow ? (
            <span className="text-xs font-normal text-slate-500">
              Required outcome — backend uses this for non-winning spins.
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            disabled={disabled}
            value={Number.isFinite(weight) ? Math.round(weight) : 0}
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              const n = Number.isFinite(v) ? Math.round(Math.max(0, v)) : 0;
              onWeightChange(n);
            }}
            aria-invalid={Boolean(error)}
            className={`w-28 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-slate-100 sm:w-32 ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
            }`}
          />
          <span className="text-sm text-slate-600">%</span>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
