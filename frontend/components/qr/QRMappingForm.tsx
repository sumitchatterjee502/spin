"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Campaign } from "@/types/campaign.types";
import type {
  QRMapping,
  QRMappingsCreateFormSubmit,
  QRMappingsEditFormSubmit,
} from "@/types/qr.types";
import { buildCampaignQrRedirectUrl, isValidPublicRedirectUrl } from "@/utils/qrUrl";

function suggestCustomCode(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < length; i++) {
    s += alphabet[bytes[i]! % alphabet.length]!;
  }
  return s;
}

export type QRMappingFormProps = {
  mode: "create" | "edit";
  campaigns: Campaign[];
  /** Existing codes (lowercase) for uniqueness; exclude `excludeCodeLower` in edit. */
  reservedCodesLower: Set<string>;
  excludeCodeLower?: string;
  /** Used only for **custom** create preview (estimated landing URL). */
  publicOrigin: string;
  submitting: boolean;
  initial?: Partial<Pick<QRMapping, "code" | "campaignId" | "redirectUrl">>;
  onLivePreviewChange?: (payload: {
    code: string;
    redirectUrl: string;
  }) => void;
  onSubmitCreate?: (payload: QRMappingsCreateFormSubmit) => void | Promise<void>;
  onSubmitEdit?: (payload: QRMappingsEditFormSubmit) => void | Promise<void>;
};

export default function QRMappingForm({
  mode,
  campaigns,
  reservedCodesLower,
  excludeCodeLower,
  publicOrigin,
  submitting,
  initial,
  onLivePreviewChange,
  onSubmitCreate,
  onSubmitEdit,
}: QRMappingFormProps) {
  const [createKind, setCreateKind] = useState<"auto" | "custom">("auto");
  const [code, setCode] = useState("");
  const [campaignId, setCampaignId] = useState("");

  useEffect(() => {
    if (!initial) return;
    if (initial.campaignId != null) setCampaignId(String(initial.campaignId));
    if (mode === "edit" && initial.code != null) setCode(initial.code);
  }, [mode, initial?.campaignId, initial?.code]);

  const previewCbRef = useRef(onLivePreviewChange);
  previewCbRef.current = onLivePreviewChange;

  const estimatedCustomUrl = useMemo(() => {
    const origin = publicOrigin.trim();
    const c = code.trim();
    if (!origin || !c) return "";
    return buildCampaignQrRedirectUrl(origin, c);
  }, [publicOrigin, code]);

  useEffect(() => {
    if (mode === "edit") {
      previewCbRef.current?.({
        code: (initial?.code ?? "").trim(),
        redirectUrl: (initial?.redirectUrl ?? "").trim(),
      });
      return;
    }
    if (createKind === "auto") {
      previewCbRef.current?.({ code: "", redirectUrl: "" });
      return;
    }
    previewCbRef.current?.({
      code: code.trim(),
      redirectUrl: estimatedCustomUrl,
    });
  }, [mode, createKind, code, estimatedCustomUrl, initial?.code, initial?.redirectUrl]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => String(c.id) === campaignId),
    [campaigns, campaignId]
  );

  const codeLower = code.trim().toLowerCase();
  const duplicateCode =
    mode === "create" &&
    createKind === "custom" &&
    codeLower.length > 0 &&
    reservedCodesLower.has(codeLower) &&
    codeLower !== (excludeCodeLower ?? "").toLowerCase();

  const campaignSelected = campaignId !== "";
  const messages: string[] = [];

  if (!campaignSelected) {
    messages.push("Select a campaign.");
  }

  if (mode === "create" && createKind === "custom") {
    if (!code.trim()) {
      messages.push("Enter a QR code or switch to auto-generated.");
    }
    if (duplicateCode) {
      messages.push("This QR code is already mapped.");
    }
    if (
      code.trim() &&
      publicOrigin.trim() &&
      !isValidPublicRedirectUrl(estimatedCustomUrl)
    ) {
      messages.push("Estimated redirect URL is invalid — check public origin.");
    }
  }

  const isValid = messages.length === 0;

  const handleSuggestCode = () => {
    let next = suggestCustomCode(10);
    let guard = 0;
    while (
      reservedCodesLower.has(next.toLowerCase()) &&
      next.toLowerCase() !== (excludeCodeLower ?? "").toLowerCase() &&
      guard < 50
    ) {
      next = suggestCustomCode(10);
      guard += 1;
    }
    setCode(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    if (mode === "edit") {
      void onSubmitEdit?.({ campaignId: Number(campaignId) });
      return;
    }

    if (createKind === "auto") {
      void onSubmitCreate?.({
        kind: "auto",
        campaignId: Number(campaignId),
      });
    } else {
      void onSubmitCreate?.({
        kind: "custom",
        code: code.trim(),
        campaignId: Number(campaignId),
      });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {mode === "create" ? "Create mapping" : "Edit mapping"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "create"
          ? "Auto mode lets the server assign the code. Custom mode sends your opaque token with the campaign id."
          : "The code and landing URL are managed by the server. You can reassign this QR to another campaign."}
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {mode === "create" ? (
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-slate-600">
              QR code source
            </legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="qr-create-kind"
                  checked={createKind === "auto"}
                  onChange={() => {
                    setCreateKind("auto");
                    setCode("");
                  }}
                  className="border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Auto-generated code (server)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="qr-create-kind"
                  checked={createKind === "custom"}
                  onChange={() => setCreateKind("custom")}
                  className="border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Custom code
              </label>
            </div>
          </fieldset>
        ) : null}

        {mode === "create" && createKind === "custom" ? (
          <div>
            <label
              htmlFor="qr-code"
              className="block text-xs font-medium text-slate-600"
            >
              QR code token
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="qr-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. DEMO_QR_001"
                autoComplete="off"
                className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm uppercase shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={handleSuggestCode}
                disabled={submitting}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Suggest code
              </button>
            </div>
          </div>
        ) : null}

        {mode === "edit" ? (
          <>
            <div>
              <span className="block text-xs font-medium text-slate-600">
                QR code (read-only)
              </span>
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
                {initial?.code ?? "—"}
              </p>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600">
                Redirect URL (read-only)
              </span>
              <p className="mt-1 break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
                {initial?.redirectUrl ?? "—"}
              </p>
            </div>
          </>
        ) : null}

        {mode === "create" && createKind === "auto" ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            The API will create the mapping with{" "}
            <code className="rounded bg-white px-1 font-mono">POST {"{"} campaignId {"}"}</code>{" "}
            and return the assigned code and URL in the list.
          </p>
        ) : null}

        <div>
          <label
            htmlFor="qr-campaign"
            className="block text-xs font-medium text-slate-600"
          >
            Campaign
          </label>
          <select
            id="qr-campaign"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name} (#{c.id})
              </option>
            ))}
          </select>
          {selectedCampaign ? (
            <p className="mt-1 text-xs text-slate-500">
              Selected:{" "}
              <span className="font-medium text-slate-700">
                {selectedCampaign.name}
              </span>
            </p>
          ) : null}
        </div>

        {messages.length > 0 ? (
          <ul className="list-inside list-disc text-xs text-red-600">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : null}

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create mapping"
              : "Save changes"}
        </button>
      </form>
    </div>
  );
}
