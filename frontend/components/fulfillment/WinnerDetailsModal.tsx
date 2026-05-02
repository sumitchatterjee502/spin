"use client";

import { useEffect, useState } from "react";
import type { WinnerEntry } from "@/types/fulfillment.types";

type WinnerDetailsModalProps = {
  winner: WinnerEntry | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payload: { address: string; alternatePhone: string; notes: string }) => Promise<void>;
};

export default function WinnerDetailsModal({
  winner,
  open,
  loading,
  onClose,
  onConfirm,
}: WinnerDetailsModalProps) {
  const [address, setAddress] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [notes, setNotes] = useState("");
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    if (!winner) return;
    setAddress(winner.address ?? "");
    setAlternatePhone(winner.alternatePhone ?? "");
    setNotes(winner.notes ?? "");
    setAddressError("");
  }, [winner]);

  if (!open || !winner) return null;

  const isAddressMissing = !(winner.address ?? "").trim();
  const requiresAddress = isAddressMissing;
  const isLocked = winner.isLocked;

  const submit = async () => {
    if (isLocked) return;
    if (requiresAddress && !address.trim()) {
      setAddressError("Delivery address is required.");
      return;
    }

    const proceed = window.confirm("Confirm this winner and send notification email?");
    if (!proceed) return;

    await onConfirm({
      address: address.trim(),
      alternatePhone: alternatePhone.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Confirm Winner</h3>
            <p className="text-sm text-slate-500">Review winner details before final confirmation.</p>
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

        <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p><span className="font-semibold">Name:</span> {winner.name || "N/A"}</p>
          <p><span className="font-semibold">Phone:</span> {winner.phone || "N/A"}</p>
          <p><span className="font-semibold">Email:</span> {winner.email || "N/A"}</p>
          <p><span className="font-semibold">Prize:</span> {winner.prizeName || "N/A"}</p>
          <p className="sm:col-span-2"><span className="font-semibold">Invoice:</span> {winner.invoiceNumber || "N/A"}</p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Delivery Address {requiresAddress ? <span className="text-rose-600">*</span> : null}
            </label>
            <textarea
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                if (addressError) setAddressError("");
              }}
              disabled={loading || isLocked}
              rows={3}
              placeholder="Enter delivery address"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
            />
            {addressError ? <p className="mt-1 text-xs text-rose-600">{addressError}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Alternate Phone (optional)</label>
            <input
              value={alternatePhone}
              onChange={(event) => setAlternatePhone(event.target.value)}
              disabled={loading || isLocked}
              type="text"
              placeholder="Enter alternate phone"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={loading || isLocked}
              rows={2}
              placeholder="Operational notes"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || isLocked}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Confirming...
              </>
            ) : (
              "Confirm Winner"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
