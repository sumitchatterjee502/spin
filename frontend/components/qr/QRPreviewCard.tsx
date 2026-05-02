"use client";

import { useCallback, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isValidPublicRedirectUrl } from "@/utils/qrUrl";

export type QRPreviewCardProps = {
  /** Full URL encoded in the QR (e.g. https://…/campaign?qr=CODE) */
  value: string;
  disabled?: boolean;
  title?: string;
};

export default function QRPreviewCard({
  value,
  disabled,
  title = "QR preview",
}: QRPreviewCardProps) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const copyUrl = useCallback(async () => {
    const t = value.trim();
    if (!t) {
      toast.error("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(t);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL.");
    }
  }, [value]);

  const downloadPng = useCallback(() => {
    const wrap = canvasWrapRef.current;
    const canvas = wrap?.querySelector("canvas");
    if (!canvas) {
      toast.error("QR is not ready to download.");
      return;
    }
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${Date.now()}.png`;
      a.click();
      toast.success("QR image downloaded");
    } catch {
      toast.error("Download failed.");
    }
  }, []);

  const valid = isValidPublicRedirectUrl(value);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">
        Scanning opens the encoded landing URL.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          ref={canvasWrapRef}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-inner"
        >
          {valid ? (
            <QRCodeCanvas
              value={value.trim()}
              size={180}
              level="M"
              includeMargin
            />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center bg-slate-50 text-center text-xs text-slate-500">
              Enter a valid redirect URL to generate the QR code.
            </div>
          )}
        </div>

        <div className="w-full min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Encoded URL
            </p>
            <p className="mt-1 break-all rounded-md bg-slate-50 px-2 py-2 font-mono text-xs text-slate-800">
              {value.trim() || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !valid}
              onClick={() => void copyUrl()}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy className="h-4 w-4" aria-hidden />
              Copy URL
            </button>
            <button
              type="button"
              disabled={disabled || !valid}
              onClick={downloadPng}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QRPreviewCardLoading() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-slate-600">
      <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
    </div>
  );
}
