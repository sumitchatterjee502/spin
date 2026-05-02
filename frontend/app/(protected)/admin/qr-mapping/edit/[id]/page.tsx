"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import QRMappingForm from "@/components/qr/QRMappingForm";
import QRPreviewCard from "@/components/qr/QRPreviewCard";
import { listCampaigns } from "@/services/campaign.service";
import { getQrFrontendSettings } from "@/services/qr-frontend-settings.service";
import { getQRMapping, getQRMappings, updateQRMapping } from "@/services/qr.service";
import type { QRMapping, QRMappingsEditFormSubmit } from "@/types/qr.types";
import type { Campaign } from "@/types/campaign.types";
import { resolveQrPublicOrigin } from "@/utils/qrUrl";
import { getQrApiErrorMessage } from "@/utils/qrApiError";

export default function AdminQrMappingEditPage() {
  const params = useParams();
  const router = useRouter();
  const idRaw = params?.id;
  const mappingId = Number(Array.isArray(idRaw) ? idRaw[0] : idRaw);

  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [publicOrigin, setPublicOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [initial, setInitial] = useState<
    Partial<Pick<QRMapping, "code" | "campaignId" | "redirectUrl">>
  >({});

  const onLivePreviewChange = useCallback(
    (p: { code: string; redirectUrl: string }) => {
      setPreviewUrl(p.redirectUrl);
    },
    []
  );

  const load = useCallback(async () => {
    if (!accessToken || !Number.isFinite(mappingId)) return;
    setLoading(true);
    try {
      const [camps, mappings, row, frontendSettings] = await Promise.all([
        listCampaigns(accessToken),
        getQRMappings(accessToken),
        getQRMapping(mappingId, accessToken),
        getQrFrontendSettings(accessToken).catch(() => null),
      ]);
      setCampaigns(camps);
      setExistingCodes(
        new Set(mappings.map((m) => m.code.trim().toLowerCase()))
      );
      setPublicOrigin(
        resolveQrPublicOrigin(frontendSettings?.frontendBaseUrl ?? null)
      );
      if (!row) {
        toast.error("QR mapping not found.");
        router.replace("/admin/qr-mapping");
        return;
      }
      setInitial({
        code: row.code,
        campaignId: row.campaignId,
        redirectUrl: row.redirectUrl,
      });
      setPreviewUrl(row.redirectUrl);
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to load mapping."));
      router.replace("/admin/qr-mapping");
    } finally {
      setLoading(false);
    }
  }, [accessToken, mappingId, router]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    if (!Number.isFinite(mappingId) || mappingId <= 0) {
      toast.error("Invalid mapping id.");
      router.replace("/admin/qr-mapping");
      return;
    }
    void load();
  }, [status, accessToken, load, mappingId, router]);

  const excludeCodeLower = useMemo(() => {
    const c = initial.code?.trim().toLowerCase();
    return c && c.length > 0 ? c : undefined;
  }, [initial.code]);

  const handleSubmitEdit = async (payload: QRMappingsEditFormSubmit) => {
    if (!accessToken || !Number.isFinite(mappingId)) return;
    setSubmitting(true);
    try {
      await updateQRMapping(
        mappingId,
        { campaignId: payload.campaignId },
        accessToken
      );
      toast.success("QR mapping updated");
      router.push("/admin/qr-mapping");
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to update mapping."));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="Edit QR mapping" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in to edit QR mappings.
        </div>
      </DataTableContent>
    );
  }

  if (!Number.isFinite(mappingId) || mappingId <= 0) {
    return null;
  }

  return (
    <DataTableContent
      title="Edit QR mapping"
      description="PATCH sends only campaignId. Code and redirect URL stay as returned by the server."
    >
      <div className="mb-4">
        <Link
          href="/admin/qr-mapping"
          className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
        >
          ← Back to list
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <span className="text-sm">Loading mapping…</span>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <QRMappingForm
              key={mappingId}
              mode="edit"
              campaigns={campaigns}
              reservedCodesLower={existingCodes}
              excludeCodeLower={excludeCodeLower}
              publicOrigin={publicOrigin}
              submitting={submitting}
              initial={initial}
              onLivePreviewChange={onLivePreviewChange}
              onSubmitEdit={handleSubmitEdit}
            />
            <section className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
              <p className="font-medium text-slate-800">Public origin</p>
              <p className="mt-1 font-mono text-slate-800">
                {publicOrigin || "—"}
              </p>
            </section>
          </div>
          <QRPreviewCard
            value={previewUrl}
            disabled={submitting}
            title="QR preview"
          />
        </div>
      )}
    </DataTableContent>
  );
}
