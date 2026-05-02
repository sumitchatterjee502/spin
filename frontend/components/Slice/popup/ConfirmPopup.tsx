"use client";

type ConfirmPopupProps = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmPopup({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmPopupProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded bg-white p-6">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded border px-3 py-1">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded bg-red-600 px-3 py-1 text-white">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
