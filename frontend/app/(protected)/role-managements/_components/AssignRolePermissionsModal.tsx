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
import { assignRolePermissions } from "@/lib/api/RolesManagement";
import { getPermissions } from "@/lib/api/PermissionsManagement";
import type { RbacPermission, RbacRole } from "@/types/rbac.types";

type AssignRolePermissionsModalProps = {
  open: boolean;
  role: RbacRole | null;
  onClose: () => void;
  onSuccess: () => void;
};

function apiErrorMessage(error: unknown, fallback: string): string {
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

type InnerProps = {
  role: RbacRole;
  accessToken?: string | null;
  titleId: string;
  searchId: string;
  onClose: () => void;
  onSuccess: () => void;
};

function AssignRolePermissionsInner({
  role,
  accessToken,
  titleId,
  searchId,
  onClose,
  onSuccess,
}: InnerProps) {
  const [allPermissions, setAllPermissions] = useState<RbacPermission[]>([]);
  const [selectedKeys, setSelectedKeys] = useState(
    () => new Set(role.permissions)
  );
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingList(true);
      try {
        const list = await getPermissions(accessToken);
        if (!cancelled) {
          setAllPermissions(
            [...list].sort((a, b) => a.key.localeCompare(b.key))
          );
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(apiErrorMessage(e, "Failed to load permissions."));
          setAllPermissions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const filteredPermissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allPermissions;
    }
    return allPermissions.filter(
      (p) =>
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [allPermissions, query]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assignRolePermissions(
        role.id,
        { permissionKeys: [...selectedKeys] },
        accessToken
      );
      toast.success("Permissions updated.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to save permissions."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white shadow-lg"
      onMouseDown={(ev) => ev.stopPropagation()}
    >
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          Assign permissions
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Role: <span className="font-medium text-slate-800">{role.name}</span>
        </p>
      </div>

      <form
        onSubmit={(ev) => void handleSubmit(ev)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <label htmlFor={searchId} className="sr-only">
            Search permissions
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by key or description…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            disabled={loadingList || submitting}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loadingList ? (
            <p className="px-2 py-8 text-center text-sm text-slate-500">
              Loading permissions…
            </p>
          ) : filteredPermissions.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-slate-500">
              No permissions match your filter.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-100">
              {filteredPermissions.map((p) => {
                const checked = selectedKeys.has(p.key);
                return (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        checked={checked}
                        onChange={() => toggleKey(p.key)}
                        disabled={submitting}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-sm text-slate-900">
                          {p.key}
                        </span>
                        {p.description !== p.key ? (
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {p.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loadingList}
            className="rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save permissions"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AssignRolePermissionsModal({
  open,
  role,
  onClose,
  onSuccess,
}: AssignRolePermissionsModalProps) {
  const { data: session } = useSession();
  const titleId = useId();
  const searchId = useId();

  const handleBackdropClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !role) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleBackdropClose();
        }
      }}
    >
      <AssignRolePermissionsInner
        key={role.id}
        role={role}
        accessToken={session?.accessToken}
        titleId={titleId}
        searchId={searchId}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}
