"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { getProductById } from "@/services/product.service";
import type { Product } from "@/types/campaign.types";

type ViewProductModalProps = {
  open: boolean;
  productId: number | null;
  onClose: () => void;
};

function loadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      error.message ||
      "Failed to load product."
    );
  }
  return error instanceof Error ? error.message : "Failed to load product.";
}

export default function ViewProductModal({
  open,
  productId,
  onClose,
}: ViewProductModalProps) {
  const { data: session } = useSession();
  const titleId = useId();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open || productId == null) {
      setProduct(null);
      setLoadError(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setProduct(null);
      setLoadError(false);
      try {
        const p = await getProductById(productId, session?.accessToken);
        if (!cancelled) setProduct(p);
      } catch (e) {
        if (!cancelled) {
          toast.error(loadErrorMessage(e));
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, productId, session?.accessToken]);

  const closeModal = useCallback(() => {
    setProduct(null);
    setLoadError(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  if (!open || productId == null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Product details
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Loaded via GET /products/:id</p>
        </div>
        <div className="px-4 py-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : loadError ? (
            <p className="text-sm text-red-600">Could not load this product.</p>
          ) : product ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">ID</dt>
                <dd className="mt-0.5 font-mono text-slate-900">#{product.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
                <dd className="mt-0.5 text-slate-900">{product.name}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        <div className="flex justify-end border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
