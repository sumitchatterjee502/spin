"use client";

type TermsCheckboxProps = {
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
};

export default function TermsCheckbox({
  checked,
  error,
  onChange,
}: TermsCheckboxProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        <span className="text-sm text-slate-700">
          I agree to Terms &amp; Conditions
        </span>
      </label>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
