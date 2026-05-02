"use client";

import type { LucideIcon } from "lucide-react";
import {
  CircleCheck,
  CircleSlash,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";

export type TableRowActionKind =
  | "view"
  | "edit"
  | "delete"
  | "active"
  | "inactive"
  | "assign";

export type TableRowActionItem = {
  kind: TableRowActionKind;
  onClick: () => void;
  /** If set, the action is only shown when `userPermissions` includes this string. */
  requiredPermission?: string;
  /** Accessible name; defaults from kind. */
  label?: string;
  disabled?: boolean;
};

const KIND_META: Record<
  TableRowActionKind,
  { icon: LucideIcon; defaultLabel: string }
> = {
  view: { icon: Eye, defaultLabel: "View" },
  edit: { icon: Pencil, defaultLabel: "Edit" },
  delete: { icon: Trash2, defaultLabel: "Delete" },
  active: { icon: CircleCheck, defaultLabel: "Activate" },
  inactive: { icon: CircleSlash, defaultLabel: "Deactivate" },
  assign: { icon: UserPlus, defaultLabel: "Assign" },
};

/** Keeps actions whose `requiredPermission` is missing or satisfied by `userPermissions`. */
export function filterActionsByPermissions(
  items: TableRowActionItem[],
  userPermissions: readonly string[] | undefined
): TableRowActionItem[] {
  return items.filter((item) => {
    if (!item.requiredPermission) {
      return true;
    }
    if (!userPermissions?.length) {
      return false;
    }
    return userPermissions.includes(item.requiredPermission);
  });
}

type TableRowActionsProps = {
  items: TableRowActionItem[];
  /**
   * When provided, each item may declare `requiredPermission`; items are filtered automatically.
   * You can also call `filterActionsByPermissions` yourself and pass a pre-filtered `items` list.
   */
  userPermissions?: readonly string[];
  className?: string;
};

export default function TableRowActions({
  items,
  userPermissions,
  className = "",
}: TableRowActionsProps) {
  const visible =
    userPermissions !== undefined
      ? filterActionsByPermissions(items, userPermissions)
      : items;

  if (!visible.length) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-1 ${className}`.trim()}
      role="group"
      aria-label="Row actions"
    >
      {visible.map((item, index) => {
        const meta = KIND_META[item.kind];
        const Icon = meta.icon;
        const label = item.label ?? meta.defaultLabel;
        const key = `${item.kind}-${index}`;
        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            disabled={item.disabled}
            onClick={item.onClick}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
