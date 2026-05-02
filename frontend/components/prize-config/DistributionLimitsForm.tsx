"use client";

import type { DistributionLimits } from "@/types/prize-config.types";

export type DistributionLimitsFormProps = {
  value: DistributionLimits;
  onChange: (next: DistributionLimits) => void;
  errors?: Partial<Record<keyof DistributionLimits, string>>;
  disabled?: boolean;
};

const fields: {
  key: keyof DistributionLimits;
  label: string;
  hint: string;
}[] = [
  {
    key: "maxPerDay",
    label: "Max wins per day (per prize)",
    hint: "Upper bound on how many times this prize can be won per calendar day.",
  },
  {
    key: "maxPerUser",
    label: "Max wins per user",
    hint: "How many times a single user can win (across the campaign).",
  },
  {
    key: "totalLimit",
    label: "Total distribution cap",
    hint: "Hard cap on total wins issued for the campaign.",
  },
];

export default function DistributionLimitsForm({
  value,
  onChange,
  errors,
  disabled,
}: DistributionLimitsFormProps) {
  const patch = (key: keyof DistributionLimits, raw: string) => {
    const n = raw === "" ? 0 : Number(raw);
    onChange({
      ...value,
      [key]: Number.isFinite(n) ? n : 0,
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {fields.map(({ key, label, hint }) => (
        <div key={key}>
          <label
            htmlFor={`dist-${key}`}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
          <input
            id={`dist-${key}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            disabled={disabled}
            value={Number.isFinite(value[key]) ? value[key] : 0}
            onChange={(e) => patch(key, e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
          {errors?.[key] ? (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors[key]}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
