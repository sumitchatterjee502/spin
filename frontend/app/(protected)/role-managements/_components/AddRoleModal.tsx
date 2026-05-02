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
import { createRole } from "@/lib/api/RolesManagement";

type AddRoleModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function createRoleErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to create role."
    );
  }
  return error instanceof Error ? error.message : "Failed to create role.";
}

export default function AddRoleModal({ open, onClose, onSuccess }: AddRoleModalProps) {
  const { data: session } = useSession();
  const titleId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setName("");
    setDescription("");
  }, []);

  const closeModal = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createRole(
        { name: trimmedName, description: trimmedDescription },
        session?.accessToken
      );
      toast.success("Role created.");
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(createRoleErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
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
            Add new role
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Create a role with a name and description. Permissions can be assigned separately if
            your API supports it.
          </p>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-4 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="add-role-name" className="block text-xs font-medium text-slate-600">
                Name
              </label>
              <input
                id="add-role-name"
                name="name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. support"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label
                htmlFor="add-role-description"
                className="block text-xs font-medium text-slate-600"
              >
                Description
              </label>
              <textarea
                id="add-role-description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Read-only support desk"
                className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled={submitting}
              />
            </div>
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
              {submitting ? "Creating…" : "Create role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
