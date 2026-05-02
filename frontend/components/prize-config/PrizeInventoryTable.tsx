"use client";

export type PrizeInventoryRowView = {
  prizeId: string;
  prizeName: string;
  stockInput: string;
  remainingStock?: number;
};

export type PrizeInventoryTableProps = {
  rows: PrizeInventoryRowView[];
  onStockChange: (prizeId: string, raw: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
};

export default function PrizeInventoryTable({
  rows,
  onStockChange,
  errors,
  disabled,
}: PrizeInventoryTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Add at least one product–prize mapping to set stock per prize.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              Prize
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              Stock
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              Remaining
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((r) => (
            <tr key={r.prizeId}>
              <td className="px-4 py-3 font-medium text-slate-900">{r.prizeName}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  disabled={disabled}
                  value={r.stockInput}
                  onChange={(e) => onStockChange(r.prizeId, e.target.value)}
                  aria-invalid={Boolean(errors?.[r.prizeId])}
                  className={`w-32 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:bg-slate-100 ${
                    errors?.[r.prizeId]
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  }`}
                />
                {errors?.[r.prizeId] ? (
                  <p className="mt-1 text-xs text-red-600">{errors[r.prizeId]}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {typeof r.remainingStock === "number" && Number.isFinite(r.remainingStock)
                  ? r.remainingStock
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
