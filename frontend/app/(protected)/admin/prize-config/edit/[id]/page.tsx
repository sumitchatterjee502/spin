"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import PrizeConfigPage from "@/components/prize-config/PrizeConfigPage";
import { getCampaignByIdFromApi } from "@/services/campaign.service";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { toast } from "sonner";

export default function EditPrizeConfigPage() {
  const params = useParams();
  const idParam = params?.id;
  const campaignId = useMemo(() => {
    const raw = Array.isArray(idParam) ? idParam[0] : idParam;
    return raw != null && String(raw).trim() !== "" ? String(raw).trim() : "";
  }, [idParam]);

  const { data: session, status } = useSession();
  const [title, setTitle] = useState<string | undefined>();

  const loadTitle = useCallback(async () => {
    await Promise.resolve();
    const n = Number(campaignId);
    if (!campaignId || !Number.isFinite(n)) {
      setTitle(undefined);
      return;
    }
    try {
      const c = await getCampaignByIdFromApi(n, session?.accessToken);
      setTitle(c?.name);
    } catch (e) {
      toast.error(getCampaignApiErrorMessage(e, "Could not resolve campaign name."));
      setTitle(undefined);
    }
  }, [campaignId, session]);

  useEffect(() => {
    if (status !== "authenticated" || !campaignId) return;
    void Promise.resolve().then(() => {
      void loadTitle();
    });
  }, [status, campaignId, loadTitle]);

  if (!campaignId) {
    return (
      <DataTableContent title="Prize configuration" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          <p className="font-medium">Missing campaign id in the URL.</p>
          <Link
            href="/admin/prize-config"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
          >
            Back to prize configuration
          </Link>
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Edit prize configuration"
      description="Update product–prize mapping, stock, and distribution limits for this campaign."
    >
      <PrizeConfigPage
        campaignId={campaignId}
        mode="edit"
        campaignTitle={title ?? campaignId}
      />
    </DataTableContent>
  );
}
