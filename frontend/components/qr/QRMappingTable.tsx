"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  QrCode,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { QRMapping } from "@/types/qr.types";
import QRPreviewCard from "@/components/qr/QRPreviewCard";

export type QRMappingTableProps = {
  rows: QRMapping[];
  loading: boolean;
  deletingId: number | null;
  onDelete: (id: number) => void | Promise<void>;
};

export default function QRMappingTable({
  rows,
  loading,
  deletingId,
  onDelete,
}: QRMappingTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [viewRow, setViewRow] = useState<QRMapping | null>(null);

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL.");
    }
  }, []);

  const confirmRow = rows.find((r) => r.id === confirmId);

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                QR code
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Campaign
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                URL
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Loading mappings…
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No QR mappings yet. Create one to link packaging scans to a
                  campaign.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                    {r.code}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <span className="font-medium">
                      {r.campaignName ?? `Campaign #${r.campaignId}`}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">
                      (#{r.campaignId})
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <a
                      href={r.redirectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-2 break-all text-xs text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                    >
                      {r.redirectUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link
                        href={`/admin/qr-mapping/edit/${r.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmId(r.id)}
                        disabled={deletingId === r.id}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyUrl(r.redirectUrl)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Copy URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewRow(r)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        <QrCode className="h-3.5 w-3.5" aria-hidden />
                        View QR
                      </button>
                      <a
                        href={r.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Open
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmId != null && confirmRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-del-title"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <h2
              id="qr-del-title"
              className="text-lg font-semibold text-slate-900"
            >
              Delete QR mapping?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This removes the link between code{" "}
              <span className="font-mono font-medium">{confirmRow.code}</span> and
              the campaign. Printed codes may stop working until you create a new
              mapping.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = confirmId;
                  setConfirmId(null);
                  void onDelete(id);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">QR code</h2>
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-600">{viewRow.code}</p>
            <div className="mt-4">
              <QRPreviewCard value={viewRow.redirectUrl} title="Scan preview" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
