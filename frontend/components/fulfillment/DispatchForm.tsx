"use client";

import { useEffect, useState } from "react";
import type { WinnerEntry } from "@/types/fulfillment.types";

type DispatchFormProps = {
  winner: WinnerEntry | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { dispatchDate: string; deliveryPartner: string; trackingId: string }) => Promise<void>;
};

export default function DispatchForm({ winner, open, loading, onClose, onSubmit }: DispatchFormProps) {
  const [dispatchDate, setDispatchDate] = useState("");
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [dispatchDateError, setDispatchDateError] = useState("");

  useEffect(() => {
    if (!winner) return;
    setDispatchDate(winner.dispatchDate ? winner.dispatchDate.slice(0, 10) : "");
    setDeliveryPartner(winner.deliveryPartner ?? "");
    setTrackingId(winner.trackingId ?? "");
    setDispatchDateError("");
  }, [winner]);

  if (!open || !winner) return null;

  const submit = async () => {
    if (!dispatchDate.trim()) {
      setDispatchDateError("Dispatch date is required.");
      return;
    }
    const proceed = window.confirm("Dispatch this prize now?");
    if (!proceed) return;
    await onSubmit({
      dispatchDate: dispatchDate.trim(),
      deliveryPartner: deliveryPartner.trim(),
      trackingId: trackingId.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Dispatch Prize</h3>
        <p className="mt-1 text-sm text-slate-500">Update dispatch details for {winner.name || "winner"}.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dispatch Date <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              value={dispatchDate}
              onChange={(event) => {
                setDispatchDate(event.target.value);
                if (dispatchDateError) setDispatchDateError("");
              }}
              disabled={loading}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            {dispatchDateError ? <p className="mt-1 text-xs text-rose-600">{dispatchDateError}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Delivery Partner (optional)</label>
            <input
              type="text"
              value={deliveryPartner}
              onChange={(event) => setDeliveryPartner(event.target.value)}
              disabled={loading}
              placeholder="Example: BlueDart"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Tracking ID (optional)</label>
            <input
              type="text"
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value)}
              disabled={loading}
              placeholder="Enter tracking reference"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              "Dispatch Prize"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
