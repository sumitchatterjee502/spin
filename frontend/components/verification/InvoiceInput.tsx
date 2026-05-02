"use client";

type InvoiceInputProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
};

export default function InvoiceInput({
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
}: InvoiceInputProps) {
  return (
    <div>
      <label htmlFor="verification-invoice-number" className="block text-sm font-medium text-slate-700">
        Invoice Number <span className="text-rose-600">*</span>
      </label>
      <input
        id="verification-invoice-number"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="Enter Invoice Number (e.g., INV-2026-001)"
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            : "border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        } disabled:cursor-not-allowed disabled:bg-slate-100`}
      />
      <p className="mt-1 min-h-4 text-xs text-rose-600">{error ?? ""}</p>
    </div>
  );
}
