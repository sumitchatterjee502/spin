"use client";

import type { ProbabilityItem } from "@/types/probability.types";
import ProbabilityRow from "./ProbabilityRow";

const LOSE_LABEL = "Better luck next time";

export type ProbabilityTableProps = {
  items: ProbabilityItem[];
  onWeightChange: (rowKey: string, nextWeight: number) => void;
  rowErrors?: Record<string, string>;
  disabled?: boolean;
  /** When true, the lose row weight is derived and its input is disabled. */
  loseWeightLocked?: boolean;
};

export default function ProbabilityTable({
  items,
  onWeightChange,
  rowErrors,
  disabled,
  loseWeightLocked,
}: ProbabilityTableProps) {
  const winRows = items.filter((i) => i.prizeId !== null);
  const loseRow = items.find((i) => i.prizeId === null);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              Outcome
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              Weight (%)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {winRows.map((row) => (
            <ProbabilityRow
              key={row.rowKey}
              outcome={row.prizeName}
              weight={row.weight}
              onWeightChange={(w) => onWeightChange(row.rowKey, w)}
              disabled={disabled}
              error={rowErrors?.[row.rowKey]}
            />
          ))}
          {loseRow ? (
            <ProbabilityRow
              key={loseRow.rowKey}
              outcome={loseRow.prizeName || LOSE_LABEL}
              weight={loseRow.weight}
              onWeightChange={(w) => onWeightChange(loseRow.rowKey, w)}
              disabled={disabled || Boolean(loseWeightLocked)}
              error={rowErrors?.[loseRow.rowKey]}
              isLoseRow
            />
          ) : (
            <tr>
              <td
                colSpan={2}
                className="px-4 py-6 text-center text-amber-800"
              >
                Missing lose outcome row. Reload or contact support — this row is
                required.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
