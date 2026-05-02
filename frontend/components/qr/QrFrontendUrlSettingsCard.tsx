"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getQrFrontendSettings,
  putQrFrontendSettings,
} from "@/services/qr-frontend-settings.service";
import { isValidPublicRedirectUrl } from "@/utils/qrUrl";
import { getQrApiErrorMessage } from "@/utils/qrApiError";

export type QrFrontendUrlSettingsCardProps = {
  accessToken: string | undefined;
  /** Called after a successful save so other panels can refresh origin. */
  onSaved?: (frontendBaseUrl: string) => void;
};

export default function QrFrontendUrlSettingsCard({
  accessToken,
  onSaved,
}: QrFrontendUrlSettingsCardProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await getQrFrontendSettings(accessToken);
      setValue(s?.frontendBaseUrl ?? "");
    } catch (e) {
      toast.error(
        getQrApiErrorMessage(e, "Could not load QR frontend settings.")
      );
      setValue("");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const trimmed = value.trim();
  const valid = trimmed === "" || isValidPublicRedirectUrl(trimmed);
  const canSave =
    Boolean(accessToken) && valid && trimmed.length > 0 && !saving;

  const handleSave = async () => {
    if (!accessToken || !canSave) return;
    setSaving(true);
    try {
      await putQrFrontendSettings({ frontendBaseUrl: trimmed }, accessToken);
      toast.success("Frontend URL saved");
      onSaved?.(trimmed.replace(/\/$/, ""));
      await load();
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to save frontend URL."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        Frontend URL for QR codes
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Base URL of the public site encoded in QR previews (e.g. your Vite or
        production domain).
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading settings…
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="qr-frontend-base-url"
              className="block text-xs font-medium text-slate-600"
            >
              Frontend base URL
            </label>
            <input
              id="qr-frontend-base-url"
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="http://localhost:5173"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            {!valid ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                Enter a valid http(s) URL (e.g. http://localhost:5173).
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Save to API
          </button>
        </div>
      )}
    </section>
  );
}
