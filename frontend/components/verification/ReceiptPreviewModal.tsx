"use client";

import type { VerificationEntry } from "@/types/verification.types";

type ReceiptPreviewModalProps = {
  entry: VerificationEntry | null;
  onClose: () => void;
};

function isPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export default function ReceiptPreviewModal({ entry, onClose }: ReceiptPreviewModalProps) {
  if (!entry) return null;

  const pdf = isPdf(entry.fileUrl);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Receipt Preview</h3>
            <p className="mt-1 text-sm text-slate-600">Receipt No: {entry.receiptNumber || "N/A"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 min-h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {!entry.fileUrl ? (
            <div className="grid h-[320px] place-items-center px-4 text-center text-sm text-slate-500">
              File URL unavailable.
            </div>
          ) : pdf ? (
            <iframe title="Receipt PDF preview" src={entry.fileUrl} className="h-[65vh] w-full" />
          ) : (
            <img src={entry.fileUrl} alt="Receipt preview" className="h-[65vh] w-full object-contain" />
          )}
        </div>

        {pdf ? (
          <a
            href={entry.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-slate-900 underline underline-offset-2"
          >
            Open PDF in new tab
          </a>
        ) : null}
      </div>
    </div>
  );
}
