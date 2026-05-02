"use client";

import { useEffect, useState } from "react";
import type { FulfillmentEntry } from "@/types/fulfillment.types";

type Props = {
  open: boolean;
  entry: FulfillmentEntry | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { address: string; remarks: string }) => Promise<void>;
};

export default function ConfirmModal({ open, entry, loading, onClose, onSubmit }: Props) {
  const [address, setAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<{ address?: string; remarks?: string }>({});

  useEffect(() => {
    if (!entry) return;
    setAddress(entry.address ?? "");
    setRemarks(entry.remarks ?? "");
    setErrors({});
  }, [entry]);

  if (!open || !entry) return null;

  const requiresAddress = !entry.address.trim();

  const submit = async () => {
    const nextErrors: { address?: string; remarks?: string } = {};
    if (requiresAddress && !address.trim()) nextErrors.address = "Address is required.";
    if (!remarks.trim()) nextErrors.remarks = "Remarks is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit({ address: address.trim(), remarks: remarks.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl transition-all">
        <h3 className="text-lg font-semibold text-slate-900">Confirm Winner</h3>
        <p className="mt-1 text-sm text-slate-500">Confirm participation #{entry.participationId}.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Address {requiresAddress ? <span className="text-rose-600">*</span> : null}
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              disabled={loading}
            />
            {errors.address ? <p className="mt-1 text-xs text-rose-600">{errors.address}</p> : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Remarks <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              disabled={loading}
            />
            {errors.remarks ? <p className="mt-1 text-xs text-rose-600">{errors.remarks}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Confirming..." : "Confirm Winner"}
          </button>
        </div>
      </div>
    </div>
  );
}
