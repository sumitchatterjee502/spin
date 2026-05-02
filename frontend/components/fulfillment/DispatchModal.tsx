"use client";

import { useEffect, useState } from "react";
import type { FulfillmentEntry } from "@/types/fulfillment.types";

type Props = {
  open: boolean;
  entry: FulfillmentEntry | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { dispatchDate: string; trackingId?: string; deliveryPartner?: string }) => Promise<void>;
};

export default function DispatchModal({ open, entry, loading, onClose, onSubmit }: Props) {
  const [dispatchDate, setDispatchDate] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entry) return;
    setDispatchDate(entry.dispatchDate ? entry.dispatchDate.slice(0, 10) : "");
    setTrackingId(entry.trackingId ?? "");
    setDeliveryPartner(entry.deliveryPartner ?? "");
    setError("");
  }, [entry]);

  if (!open || !entry) return null;

  const submit = async () => {
    if (!dispatchDate.trim()) {
      setError("Dispatch date is required.");
      return;
    }
    await onSubmit({
      dispatchDate: dispatchDate.trim(),
      trackingId: trackingId.trim() || undefined,
      deliveryPartner: deliveryPartner.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl transition-all">
        <h3 className="text-lg font-semibold text-slate-900">Dispatch Prize</h3>
        <p className="mt-1 text-sm text-slate-500">Set shipment details for participation #{entry.participationId}.</p>

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
                setError("");
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              disabled={loading}
            />
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tracking ID</label>
            <input
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Delivery Partner</label>
            <input
              value={deliveryPartner}
              onChange={(event) => setDeliveryPartner(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              disabled={loading}
            />
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
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Dispatching..." : "Dispatch Prize"}
          </button>
        </div>
      </div>
    </div>
  );
}
