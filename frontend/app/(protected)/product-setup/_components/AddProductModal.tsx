"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { createProduct } from "@/services/product.service";

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function createProductErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to create product."
    );
  }
  return error instanceof Error ? error.message : "Failed to create product.";
}

export default function AddProductModal({
  open,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const { data: session } = useSession();
  const titleId = useId();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setName("");
  }, []);

  const closeModal = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createProduct({ name: trimmed }, session?.accessToken);
      toast.success("Product created.");
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(createProductErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
            Add product
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Create a catalog product. Name must be unique if your API enforces it.
          </p>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-4 py-4">
          <div>
            <label htmlFor="add-product-name" className="block text-xs font-medium text-slate-600">
              Name
            </label>
            <input
              id="add-product-name"
              name="name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shampoo"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              disabled={submitting}
              required
            />
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
