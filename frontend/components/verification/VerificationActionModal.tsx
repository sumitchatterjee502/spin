"use client";

import axios from "axios";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { VerificationActionType, VerificationEntry } from "@/types/verification.types";
import DuplicateWarning from "@/components/verification/DuplicateWarning";
import InvoiceInput from "@/components/verification/InvoiceInput";

type VerificationActionModalProps = {
  entry: VerificationEntry | null;
  actionType: VerificationActionType | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { invoiceNumber: string; remarks: string }) => Promise<void>;
};

type FormErrors = {
  invoice?: string;
  remarks?: string;
};

const invoiceRegex = /^[A-Za-z0-9-/]+$/;

function isPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export default function VerificationActionModal({
  entry,
  actionType,
  loading,
  onClose,
  onSubmit,
}: VerificationActionModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState<string>(entry?.invoiceNumber ?? "");
  const [remarks, setRemarks] = useState<string>(entry?.remarks ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const maxChars = 500;
  const normalizedRemarks = remarks.trim();

  const isApprove = actionType === "APPROVE";
  const normalizedInvoiceNumber = invoiceNumber.trim();
  const invoiceIsFormatValid = useMemo(() => {
    if (!normalizedInvoiceNumber) return false;
    if (normalizedInvoiceNumber.length < 5 || normalizedInvoiceNumber.length > 50) return false;
    return invoiceRegex.test(normalizedInvoiceNumber);
  }, [normalizedInvoiceNumber]);

  const remarksHasError = useMemo(() => {
    if (!normalizedRemarks) return true;
    return normalizedRemarks.length > maxChars;
  }, [normalizedRemarks]);

  if (!entry || !actionType) return null;

  const pdf = isPdf(entry.fileUrl);
  const actionLabel = actionType === "APPROVE" ? "Approve" : "Reject";
  const actionClass =
    actionType === "APPROVE"
      ? "bg-emerald-600 hover:bg-emerald-500"
      : "bg-rose-600 hover:bg-rose-500";

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!normalizedRemarks) nextErrors.remarks = "Remarks are required.";
    else if (normalizedRemarks.length > maxChars) {
      nextErrors.remarks = `Remarks cannot exceed ${maxChars} characters.`;
    }

    if (isApprove) {
      if (!normalizedInvoiceNumber) nextErrors.invoice = "Invoice number is required.";
      else if (normalizedInvoiceNumber.length < 5 || normalizedInvoiceNumber.length > 50) {
        nextErrors.invoice = "Invoice number must be between 5 and 50 characters.";
      } else if (!invoiceRegex.test(normalizedInvoiceNumber)) {
        nextErrors.invoice = "Invalid invoice format";
      }
    }

    return nextErrors;
  };

  const canApprove =
    !loading &&
    !duplicateWarning &&
    !remarksHasError &&
    (isApprove ? Boolean(normalizedInvoiceNumber) && invoiceIsFormatValid : true);

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const confirmed = window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this submission?`);
    if (!confirmed) return;

    try {
      await onSubmit({ invoiceNumber: normalizedInvoiceNumber, remarks: normalizedRemarks });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = String(
          (error.response?.data as { message?: unknown } | undefined)?.message ?? ""
        ).trim();
        const lowerMessage = message.toLowerCase();

        if (status === 409) {
          if (lowerMessage.includes("duplicate receipt detected")) {
            setDuplicateWarning("This receipt has already been submitted");
            return;
          }
          if (lowerMessage.includes("invoice already used")) {
            setErrors((prev) => ({ ...prev, invoice: "Invoice already used" }));
            return;
          }
        }

        if (status === 400) {
          if (isApprove) {
            setErrors((prev) => ({
              ...prev,
              invoice: prev.invoice || "Please provide a valid invoice number.",
              remarks: prev.remarks || "Please provide valid remarks.",
            }));
          } else {
            setErrors((prev) => ({
              ...prev,
              remarks: prev.remarks || "Please provide valid remarks.",
            }));
          }
          return;
        }
      }

      toast.error("Unable to submit verification action.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 transition-opacity duration-200">
      <div className="w-full max-w-4xl rounded-xl bg-white p-4 shadow-xl transition-all duration-200 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {actionLabel} Submission
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Review receipt and add verification remarks.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p><span className="font-semibold text-slate-800">Name:</span> {entry.name || "N/A"}</p>
            <p><span className="font-semibold text-slate-800">Phone:</span> {entry.phone || "N/A"}</p>
            <p><span className="font-semibold text-slate-800">Email:</span> {entry.email || "N/A"}</p>
            <p><span className="font-semibold text-slate-800">Store:</span> {entry.shopLocation || "N/A"}</p>
            <p><span className="font-semibold text-slate-800">Prize:</span> {entry.prizeName || "Winner Prize"}</p>
            <p><span className="font-semibold text-slate-800">Receipt No:</span> {entry.receiptNumber || "N/A"}</p>
            <p><span className="font-semibold text-slate-800">Purchase Date:</span> {entry.purchaseDate || "N/A"}</p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {!entry.fileUrl ? (
              <div className="grid h-[280px] place-items-center px-4 text-sm text-slate-500">File URL unavailable.</div>
            ) : pdf ? (
              <iframe title="Receipt preview" src={entry.fileUrl} className="h-[280px] w-full" />
            ) : (
              <img src={entry.fileUrl} alt="Receipt preview" className="h-[280px] w-full object-contain" />
            )}
          </div>
        </div>

        {isApprove ? (
          <div className="mt-4">
            <InvoiceInput
              value={invoiceNumber}
              error={errors.invoice}
              onBlur={() => setErrors((prev) => ({ ...prev, ...validateForm() }))}
              disabled={loading}
              onChange={(value) => {
                setInvoiceNumber(value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.invoice;
                  return next;
                });

                const trimmed = value.trim();
                if (!trimmed) {
                  setErrors((prev) => ({ ...prev, invoice: "Invoice number is required." }));
                  return;
                }
                if (trimmed.length < 5 || trimmed.length > 50 || !invoiceRegex.test(trimmed)) {
                  setErrors((prev) => ({ ...prev, invoice: "Invalid invoice format" }));
                  return;
                }
              }}
            />
            <DuplicateWarning message={duplicateWarning} />
          </div>
        ) : null}

        <div className="mt-4">
          <label htmlFor="verification-remarks" className="block text-sm font-medium text-slate-700">
            Remarks <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="verification-remarks"
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.remarks;
                return next;
              });
            }}
            onBlur={() => {
              if (!remarks.trim()) {
                setErrors((prev) => ({ ...prev, remarks: "Remarks are required." }));
              }
            }}
            maxLength={maxChars}
            rows={4}
            placeholder="Write verification notes..."
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
              errors.remarks
                ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                : "border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-rose-600">{errors.remarks ?? ""}</p>
            <p className="text-xs text-slate-500">{remarks.length}/{maxChars}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isApprove ? !canApprove : loading || remarksHasError}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${actionClass}`}
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing...
              </>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
