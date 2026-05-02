"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import PrizeConfigPage from "@/components/prize-config/PrizeConfigPage";
import {
  getCampaignByIdFromApi,
  listCampaignsPaginated,
} from "@/services/campaign.service";
import type { Campaign } from "@/types/campaign.types";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { toast } from "sonner";

function CreatePrizeConfigInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaignId")?.trim() ?? "";
  const { data: session, status } = useSession();

  const [pickerCampaigns, setPickerCampaigns] = useState<Campaign[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [campaignTitle, setCampaignTitle] = useState<string | undefined>();

  const numericSelected = useMemo(() => {
    const n = Number(selectedId);
    return Number.isFinite(n) ? n : NaN;
  }, [selectedId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      setPickerLoading(true);
      try {
        const res = await listCampaignsPaginated(
          { page: 1, limit: 100, search: "", status: "ALL" },
          session?.accessToken
        );
        if (!cancelled) setPickerCampaigns(res.campaigns);
      } catch (e) {
        if (!cancelled) {
          toast.error(getCampaignApiErrorMessage(e, "Failed to load campaigns."));
          setPickerCampaigns([]);
        }
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken]);

  const loadTitle = useCallback(
    async (cid: string) => {
      await Promise.resolve();
      const n = Number(cid);
      if (!Number.isFinite(n)) {
        setCampaignTitle(undefined);
        return;
      }
      try {
        const c = await getCampaignByIdFromApi(n, session?.accessToken);
        setCampaignTitle(c?.name);
      } catch {
        setCampaignTitle(undefined);
      }
    },
    [session]
  );

  useEffect(() => {
    if (!campaignIdParam) {
      void Promise.resolve().then(() => {
        setCampaignTitle(undefined);
      });
      return;
    }
    void Promise.resolve().then(() => {
      void loadTitle(campaignIdParam);
    });
  }, [campaignIdParam, loadTitle]);

  const continueWithSelection = () => {
    if (!selectedId.trim()) {
      toast.error("Select a campaign first.");
      return;
    }
    router.push(
      `/admin/prize-config/create?campaignId=${encodeURIComponent(selectedId.trim())}`
    );
  };

  if (campaignIdParam) {
    return (
      <PrizeConfigPage
        campaignId={campaignIdParam}
        mode="create"
        campaignTitle={campaignTitle ?? campaignIdParam}
      />
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        Sign in to create prize configuration.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Select campaign</h2>
        <p className="mt-1 text-sm text-slate-600">
          Prize configuration is stored per campaign. Pick which campaign you are
          configuring.
        </p>
      </div>
      {pickerLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading campaigns…
        </div>
      ) : (
        <>
          <div>
            <label
              htmlFor="prize-create-campaign"
              className="block text-sm font-medium text-slate-700"
            >
              Campaign
            </label>
            <select
              id="prize-create-campaign"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Choose…</option>
              {pickerCampaigns.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} (#{c.id})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => continueWithSelection()}
              disabled={!Number.isFinite(numericSelected)}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
            <Link
              href="/admin/prize-config"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function CreatePrizeConfigPage() {
  return (
    <DataTableContent
      title="New prize configuration"
      description="Choose a campaign, then map products to prizes and set inventory and limits."
    >
      <Suspense
        fallback={
          <div className="flex items-center gap-2 py-12 text-sm text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Loading…
          </div>
        }
      >
        <CreatePrizeConfigInner />
      </Suspense>
    </DataTableContent>
  );
}
