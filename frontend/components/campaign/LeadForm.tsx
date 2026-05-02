"use client";

import { useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import ReceiptUploader, {
  ALLOWED_RECEIPT_TYPES,
  MAX_RECEIPT_SIZE_BYTES,
} from "@/components/campaign/ReceiptUploader";
import TermsCheckbox from "@/components/campaign/TermsCheckbox";
import type { LeadFieldErrors, LeadFormData } from "@/types/lead.types";

type LeadFormProps = {
  form: LeadFormData;
  errors: LeadFieldErrors;
  submitting: boolean;
  previewUrl: string | null;
  onChange: <K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) => void;
  onSubmit: () => void;
};

export function validateLeadForm(form: LeadFormData): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!/^\+?[0-9]{8,15}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.address.trim()) errors.address = "Address is required.";
  if (!form.receiptNumber.trim()) errors.receiptNumber = "Receipt number is required.";
  if (!form.shopLocation.trim()) errors.shopLocation = "Shop location is required.";
  if (!form.file) {
    errors.file = "Receipt file is required.";
  } else {
    if (!ALLOWED_RECEIPT_TYPES.includes(form.file.type as never)) {
      errors.file = "Invalid file type.";
    } else if (form.file.size > MAX_RECEIPT_SIZE_BYTES) {
      errors.file = "File exceeds 5MB.";
    }
  }
  if (!form.termsAccepted) errors.termsAccepted = "Please accept Terms & Conditions.";
  return errors;
}

export default function LeadForm({
  form,
  errors,
  submitting,
  previewUrl,
  onChange,
  onSubmit,
}: LeadFormProps) {
  const refs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const canSubmit = useMemo(() => !submitting && form.termsAccepted, [submitting, form.termsAccepted]);

  const fieldClass = (error?: string) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      error
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-slate-500 focus:ring-slate-200"
    }`;

  const submitWithScroll = () => {
    const nextErrors = validateLeadForm(form);
    const firstKey = Object.keys(nextErrors)[0];
    if (firstKey) {
      const el = refs.current[firstKey];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }
    onSubmit();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900">Register to Participate</h3>
      <p className="mt-1 text-sm text-slate-600">
        Fill all details and upload your receipt to enter the spin.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="lead-name"
            ref={(el) => (refs.current.name = el)}
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={fieldClass(errors.name)}
          />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="lead-phone" className="text-sm font-medium text-slate-700">
            Phone Number
          </label>
          <input
            id="lead-phone"
            ref={(el) => (refs.current.phone = el)}
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value.replace(/[^\d+]/g, ""))}
            className={fieldClass(errors.phone)}
            inputMode="numeric"
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
        </div>
        <div>
          <label htmlFor="lead-email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="lead-email"
            ref={(el) => (refs.current.email = el)}
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={fieldClass(errors.email)}
            type="email"
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
        </div>
        <div>
          <label htmlFor="lead-receipt-number" className="text-sm font-medium text-slate-700">
            Receipt Number
          </label>
          <input
            id="lead-receipt-number"
            ref={(el) => (refs.current.receiptNumber = el)}
            value={form.receiptNumber}
            onChange={(e) => onChange("receiptNumber", e.target.value)}
            className={fieldClass(errors.receiptNumber)}
          />
          {errors.receiptNumber ? (
            <p className="mt-1 text-xs text-red-600">{errors.receiptNumber}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="lead-address" className="text-sm font-medium text-slate-700">
            Address
          </label>
          <textarea
            id="lead-address"
            ref={(el) => (refs.current.address = el)}
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
            className={fieldClass(errors.address)}
            rows={3}
          />
          {errors.address ? <p className="mt-1 text-xs text-red-600">{errors.address}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="lead-shop-location" className="text-sm font-medium text-slate-700">
            Shop Location
          </label>
          <input
            id="lead-shop-location"
            ref={(el) => (refs.current.shopLocation = el)}
            value={form.shopLocation}
            onChange={(e) => onChange("shopLocation", e.target.value)}
            className={fieldClass(errors.shopLocation)}
          />
          {errors.shopLocation ? (
            <p className="mt-1 text-xs text-red-600">{errors.shopLocation}</p>
          ) : null}
        </div>
      </div>

      <div
        id="lead-file"
        className="mt-4"
        ref={(el) => (refs.current.file = el as HTMLInputElement | null)}
      >
        <ReceiptUploader
          file={form.file}
          previewUrl={previewUrl}
          error={errors.file}
          onChange={(file) => onChange("file", file)}
        />
      </div>

      <div
        id="lead-terms"
        className="mt-4"
        ref={(el) => (refs.current.termsAccepted = el as HTMLInputElement | null)}
      >
        <TermsCheckbox
          checked={form.termsAccepted}
          error={errors.termsAccepted}
          onChange={(checked) => onChange("termsAccepted", checked)}
        />
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-slate-100 bg-white/95 pt-4 backdrop-blur sm:static sm:border-t-0 sm:bg-transparent sm:pt-0">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submitWithScroll}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitting ? "Submitting..." : "Submit & Continue"}
        </button>
      </div>
    </section>
  );
}
