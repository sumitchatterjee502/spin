"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import QRMappingForm from "@/components/qr/QRMappingForm";
import QRPreviewCard from "@/components/qr/QRPreviewCard";
import { listCampaigns } from "@/services/campaign.service";
import { getQrFrontendSettings } from "@/services/qr-frontend-settings.service";
import {
  createQRMappingAuto,
  createQRMappingCustom,
  getQRMappings,
} from "@/services/qr.service";
import type { QRMappingsCreateFormSubmit } from "@/types/qr.types";
import type { Campaign } from "@/types/campaign.types";
import { resolveQrPublicOrigin } from "@/utils/qrUrl";
import { getQrApiErrorMessage } from "@/utils/qrApiError";

export default function AdminQrMappingCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [publicOrigin, setPublicOrigin] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const onLivePreviewChange = useCallback(
    (p: { code: string; redirectUrl: string }) => {
      setPreviewUrl(p.redirectUrl);
    },
    []
  );

  const loadMeta = useCallback(async () => {
    if (!accessToken) return;
    setLoadingMeta(true);
    try {
      const [camps, mappings, frontendSettings] = await Promise.all([
        listCampaigns(accessToken),
        getQRMappings(accessToken),
        getQrFrontendSettings(accessToken).catch(() => null),
      ]);
      setCampaigns(camps);
      setExistingCodes(
        new Set(mappings.map((m) => m.code.trim().toLowerCase()))
      );
      setPublicOrigin(
        resolveQrPublicOrigin(frontendSettings?.frontendBaseUrl ?? null)
      );
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to load form data."));
      setCampaigns([]);
      setExistingCodes(new Set());
    } finally {
      setLoadingMeta(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    void loadMeta();
  }, [status, accessToken, loadMeta]);

  const reservedCodesLower = useMemo(() => existingCodes, [existingCodes]);

  const handleSubmitCreate = async (payload: QRMappingsCreateFormSubmit) => {
    if (!accessToken) {
      toast.error("You must be signed in.");
      return;
    }
    setSubmitting(true);
    try {
      if (payload.kind === "auto") {
        await createQRMappingAuto(
          { campaignId: payload.campaignId },
          accessToken
        );
      } else {
        await createQRMappingCustom(
          { code: payload.code, campaignId: payload.campaignId },
          accessToken
        );
      }
      toast.success("QR mapping created");
      router.push("/admin/qr-mapping");
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to create mapping."));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="Create QR mapping" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in to create QR mappings.
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Create QR mapping"
      description=""
    >
      <div className="mb-4">
        <Link
          href="/admin/qr-mapping"
          className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
        >
          ← Back to list
        </Link>
      </div>

      {loadingMeta ? (
        <p className="text-sm text-slate-600">Loading campaigns…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <QRMappingForm
              mode="create"
              campaigns={campaigns}
              reservedCodesLower={reservedCodesLower}
              publicOrigin={publicOrigin}
              submitting={submitting}
              onLivePreviewChange={onLivePreviewChange}
              onSubmitCreate={handleSubmitCreate}
            />
            <section className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
              <p className="font-medium text-slate-800">Public origin (preview)</p>
              <p className="mt-1">
                Uses the URL saved under{" "}
                <strong>QR code mapping</strong> → frontend settings (API), then
                env, then this browser origin. Current:{" "}
                <span className="font-mono text-slate-800">
                  {publicOrigin || "—"}
                </span>
              </p>
            </section>
          </div>
          <QRPreviewCard
            value={previewUrl}
            disabled={submitting}
            title="QR preview (custom codes)"
          />
        </div>
      )}
    </DataTableContent>
  );
}
