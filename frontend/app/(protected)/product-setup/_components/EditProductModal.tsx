"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { getProductById, updateProduct } from "@/services/product.service";
import type { Product } from "@/types/campaign.types";

type EditProductModalProps = {
  open: boolean;
  productId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
}

export default function EditProductModal({
  open,
  productId,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const { data: session } = useSession();
  const titleId = useId();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || productId == null) {
      setName("");
      setLoadError(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      setName("");
      try {
        const p: Product = await getProductById(productId, session?.accessToken);
        if (!cancelled) setName(p.name);
      } catch (e) {
        if (!cancelled) {
          toast.error(errorMessage(e, "Failed to load product."));
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
    setName("");
    setLoadError(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal, submitting]);

  if (!open || productId == null) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await updateProduct(productId, { name: trimmed }, session?.accessToken);
      toast.success("Product updated.");
      onSuccess();
      closeModal();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update product."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) closeModal();
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
            Edit product
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Update name via PATCH /products/:id
          </p>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading product…
            </div>
          ) : loadError ? (
            <p className="text-sm text-red-600">Could not load this product.</p>
          ) : (
            <div>
              <label htmlFor="edit-product-name" className="block text-xs font-medium text-slate-600">
                Name
              </label>
              <input
                id="edit-product-name"
                name="name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled={submitting}
                required
              />
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading || loadError}
              className="rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
