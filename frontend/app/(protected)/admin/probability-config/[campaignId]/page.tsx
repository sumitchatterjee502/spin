"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import ProbabilityCampaignEditor from "@/components/probability/ProbabilityCampaignEditor";
import { getCampaignByIdFromApi } from "@/services/campaign.service";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { toast } from "sonner";

export default function ProbabilityConfigCampaignPage() {
  const params = useParams();
  const idParam = params?.campaignId;
  const campaignId = useMemo(() => {
    const raw = Array.isArray(idParam) ? idParam[0] : idParam;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }, [idParam]);

  const { data: session, status } = useSession();
  const [title, setTitle] = useState<string | undefined>();

  const loadTitle = useCallback(async () => {
    await Promise.resolve();
    if (!Number.isFinite(campaignId)) {
      setTitle(undefined);
      return;
    }
    try {
      const c = await getCampaignByIdFromApi(campaignId, session?.accessToken);
      setTitle(c?.name);
    } catch (e) {
      toast.error(getCampaignApiErrorMessage(e, "Could not load campaign name."));
      setTitle(undefined);
    }
  }, [campaignId, session]);

  useEffect(() => {
    if (status !== "authenticated" || !Number.isFinite(campaignId)) return;
    void Promise.resolve().then(() => {
      void loadTitle();
    });
  }, [status, campaignId, loadTitle]);

  if (!Number.isFinite(campaignId)) {
    return (
      <DataTableContent title="Spin probability configuration" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          <p className="font-medium">Invalid campaign id in the URL.</p>
          <Link
            href="/admin/probability-config"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
          >
            Back to probability configuration
          </Link>
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Campaign probability weights"
      description="Set percentage weights for each prize and for the non-winning outcome. Total must equal 100%."
    >
      <ProbabilityCampaignEditor
        campaignId={campaignId}
        campaignTitle={title ?? `Campaign #${campaignId}`}
      />
    </DataTableContent>
  );
}
