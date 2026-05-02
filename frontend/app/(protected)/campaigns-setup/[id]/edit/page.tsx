"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import CampaignForm from "@/components/campaign/CampaignForm";
import { getCampaignByIdFromApi } from "@/services/campaign.service";
import type { Campaign, CampaignFormValues } from "@/types/campaign.types";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { toDateInputValue } from "@/utils/toDateInputValue";

function campaignToFormValues(c: Campaign): CampaignFormValues {
  return {
    name: c.name,
    startDate: toDateInputValue(c.startDate),
    endDate: toDateInputValue(c.endDate),
    productIds: c.products?.map((p) => p.id) ?? [],
    status: c.status,
  };
}

export default function EditCampaignPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const idParam = params?.id;
  const campaignId = useMemo(() => {
    const n = Number(Array.isArray(idParam) ? idParam[0] : idParam);
    return Number.isFinite(n) ? n : NaN;
  }, [idParam]);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(campaignId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (sessionStatus === "loading") {
      return;
    }
    if (sessionStatus !== "authenticated") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setFetchError(false);
    try {
      const found = await getCampaignByIdFromApi(
        campaignId,
        session?.accessToken
      );
      if (!found) {
        setNotFound(true);
        setCampaign(null);
      } else {
        setCampaign(found);
      }
    } catch (e) {
      toast.error(getCampaignApiErrorMessage(e, "Failed to load campaign."));
      setFetchError(true);
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, session?.accessToken, sessionStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  if (sessionStatus === "unauthenticated") {
    return (
      <DataTableContent title="Edit campaign" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in to edit this campaign.
        </div>
      </DataTableContent>
    );
  }

  if (fetchError) {
    return (
      <DataTableContent title="Edit campaign" description="">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="font-medium text-red-900">Could not load this campaign.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Retry
          </button>
          <div className="mt-3">
            <Link
              href="/campaigns-setup"
              className="text-sm font-medium text-slate-900 underline"
            >
              Back to campaigns
            </Link>
          </div>
        </div>
      </DataTableContent>
    );
  }

  if (!Number.isFinite(campaignId) || notFound) {
    return (
      <DataTableContent title="Edit campaign" description="">
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-6 text-center">
          <p className="font-medium text-amber-900">Campaign not found.</p>
          <Link
            href="/campaigns-setup"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
          >
            Back to campaigns
          </Link>
        </div>
      </DataTableContent>
    );
  }

  if (loading || !campaign) {
    return (
      <DataTableContent title="Edit campaign" description="">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-1/2 rounded bg-slate-200" />
          <div className="h-10 max-w-xl rounded bg-slate-200" />
          <div className="h-10 max-w-xl rounded bg-slate-200" />
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title={`Edit: ${campaign.name}`}
      description="Update campaign details and product mapping."
    >
      <CampaignForm
        mode="edit"
        campaignId={campaign.id}
        initialValues={campaignToFormValues(campaign)}
        syncKey={campaign.id}
      />
    </DataTableContent>
  );
}
