"use client";

export type ProbabilitySummaryProps = {
  totalWeight: number;
  /** `100 - totalWeight` (can be negative if over). */
  remainingWeight: number;
  isValid: boolean;
  messages: string[];
  autoBalanceLose: boolean;
  onAutoBalanceChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function ProbabilitySummary({
  totalWeight,
  remainingWeight,
  isValid,
  messages,
  autoBalanceLose,
  onAutoBalanceChange,
  disabled,
}: ProbabilitySummaryProps) {
  const totalRounded = Math.round(totalWeight * 1000) / 1000;
  const remRounded = Math.round(remainingWeight * 1000) / 1000;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Summary</h3>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            isValid
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          role="status"
          aria-live="polite"
        >
          <div>Total weight: {totalRounded}%</div>
          <div className="mt-1 font-normal">
            Remaining to reach 100%:{" "}
            <span className="font-semibold">{remRounded}%</span>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={autoBalanceLose}
            disabled={disabled}
            onChange={(e) => onAutoBalanceChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Auto-adjust “Better luck” to keep total at 100%
        </label>
      </div>

      {messages.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-slate-500">
        Final spin outcomes are determined by the backend using this configuration.
        The frontend does not perform random selection.
      </p>
    </div>
  );
}
