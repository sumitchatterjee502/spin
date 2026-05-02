"use client";

import { Download, Plus, Upload } from "lucide-react";
import ToolbarActionButton from "@/components/Slice/UI/ToolbarActionButton";

type DataTableHeaderActionsProps = {
  selectedItems: number[];
  setShowAddModal?: (show: boolean) => void;
  title: string;
  description?: string;
  exportButton?: boolean;
  addButtonText?: string;
  importButtonText?: string;
  onImportClick?: () => void;
};

export default function DataTableHeaderActions({
  selectedItems,
  setShowAddModal,
  title,
  description,
  exportButton = true,
  addButtonText,
  importButtonText,
  onImportClick,
}: DataTableHeaderActionsProps) {
  return (
    <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          {title ? (
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {selectedItems.length > 0 ? (
          <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            {selectedItems.length} selected
          </span>
        ) : null}
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        {exportButton ? (
          <ToolbarActionButton variant="secondary" icon={Download}>
            Export
          </ToolbarActionButton>
        ) : null}
        {importButtonText && onImportClick ? (
          <ToolbarActionButton
            variant="secondary"
            icon={Upload}
            onClick={onImportClick}
          >
            {importButtonText}
          </ToolbarActionButton>
        ) : null}
        {addButtonText ? (
          <ToolbarActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowAddModal?.(true)}
          >
            {addButtonText}
          </ToolbarActionButton>
        ) : null}
      </div>
    </div>
  );
}
