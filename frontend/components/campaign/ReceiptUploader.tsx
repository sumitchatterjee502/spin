"use client";

import Image from "next/image";
import { X } from "lucide-react";

type ReceiptUploaderProps = {
  file: File | null;
  previewUrl: string | null;
  error?: string;
  onChange: (file: File | null) => void;
};

export const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

export default function ReceiptUploader({
  file,
  previewUrl,
  error,
  onChange,
}: ReceiptUploaderProps) {
  return (
    <div>
      <label htmlFor="receipt-file" className="text-sm font-medium text-slate-700">
        Receipt Upload
      </label>
      <input
        id="receipt-file"
        type="file"
        accept={ALLOWED_RECEIPT_TYPES.join(",")}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="mt-1 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:cursor-pointer file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700"
      />
      <p className="mt-1 text-xs text-slate-500">
        Accepted: JPG, PNG, WEBP, PDF. Max size 5MB.
      </p>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {file ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">{file.name}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Remove
            </button>
          </div>
          {previewUrl && file.type.startsWith("image/") ? (
            <Image
              src={previewUrl}
              alt="Receipt preview"
              width={1000}
              height={700}
              unoptimized
              className="mt-2 max-h-64 w-full rounded-md object-contain"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
