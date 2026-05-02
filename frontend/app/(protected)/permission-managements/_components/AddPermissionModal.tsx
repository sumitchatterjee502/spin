"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { createPermission } from "@/lib/api/PermissionsManagement";

type AddPermissionModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const PERMISSION_ACTIONS = [
  { value: "read", label: "Read" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
] as const;

function createPermissionErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data as { message?: string; error?: string } | undefined;
    return (
      (typeof msg?.message === "string" && msg.message) ||
      (typeof msg?.error === "string" && msg.error) ||
      error.message ||
      "Failed to create permission."
    );
  }
  return error instanceof Error ? error.message : "Failed to create permission.";
}

/** Normalizes module segment: lowercase, trim, no colons, spaces → underscore */
function normalizeModuleSegment(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/:/g, "");
}

export default function AddPermissionModal({
  open,
  onClose,
  onSuccess,
}: AddPermissionModalProps) {
  const { data: session } = useSession();
  const titleId = useId();
  const moduleInputId = useId();
  const actionSelectId = useId();
  const descriptionId = useId();

  const [moduleName, setModuleName] = useState("");
  const [action, setAction] = useState<(typeof PERMISSION_ACTIONS)[number]["value"]>("read");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const generatedPermissionKey = useMemo(() => {
    const mod = normalizeModuleSegment(moduleName);
    if (!mod || !action) {
      return "";
    }
    return `${mod}:${action}`;
  }, [moduleName, action]);

  const reset = useCallback(() => {
    setModuleName("");
    setAction("read");
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
    const mod = normalizeModuleSegment(moduleName);
    if (!mod) {
      toast.error("Module name is required.");
      return;
    }
    const permissionKey = `${mod}:${action}`;
    const trimmedDescription = description.trim();

    setSubmitting(true);
    try {
      await createPermission(
        { permissionKey, description: trimmedDescription },
        session?.accessToken
      );
      toast.success("Permission created.");
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(createPermissionErrorMessage(err));
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
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Add permission
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Set the module name and action. The permission key is sent as{" "}
            <span className="font-mono text-slate-700">module:action</span>.
          </p>
        </div>
        <form onSubmit={(ev) => void handleSubmit(ev)} className="px-4 py-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor={moduleInputId}
                className="block text-xs font-medium text-slate-600"
              >
                Module name
              </label>
              <input
                id={moduleInputId}
                name="moduleName"
                type="text"
                autoComplete="off"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="campaign"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label
                htmlFor={actionSelectId}
                className="block text-xs font-medium text-slate-600"
              >
                Action
              </label>
              <select
                id={actionSelectId}
                name="action"
                value={action}
                onChange={(e) =>
                  setAction(
                    e.target.value as (typeof PERMISSION_ACTIONS)[number]["value"]
                  )
                }
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled={submitting}
              >
                {PERMISSION_ACTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-600">Permission key (generated)</p>
              <p className="mt-1 font-mono text-sm text-slate-900">
                {generatedPermissionKey || "—"}
              </p>
            </div>
            <div>
              <label
                htmlFor={descriptionId}
                className="block text-xs font-medium text-slate-600"
              >
                Description
              </label>
              <textarea
                id={descriptionId}
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Archive campaigns (example)"
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
              disabled={submitting || !generatedPermissionKey}
              className="rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create permission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
