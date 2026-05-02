"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import { listCampaigns } from "@/services/campaign.service";
import type { Campaign } from "@/types/campaign.types";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";

export default function ProbabilityConfigIndexPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      setLoading(true);
      try {
        const res = await listCampaigns(
          session?.accessToken
        );
        if (!cancelled) setCampaigns(res as Campaign[]);
      } catch (e) {
        if (!cancelled) {
          toast.error(getCampaignApiErrorMessage(e, "Failed to load campaigns."));
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken]);

  const numericSelection = useMemo(() => {
    const n = Number(selectedId);
    return Number.isFinite(n) ? n : NaN;
  }, [selectedId]);

  const goToCampaign = () => {
    if (!Number.isFinite(numericSelection)) {
      toast.error("Select a campaign.");
      return;
    }
    router.push(`/admin/probability-config/${numericSelection}`);
  };

  const onCampaignDropdownChange = (id: string) => {
    setSelectedId(id);
    if (!id) return;
    const n = Number(id);
    if (Number.isFinite(n)) {
      router.push(`/admin/probability-config/${n}`);
    }
  };

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="Spin probability configuration" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in to configure spin probabilities.
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="Spin probability configuration"
      description="Choose a campaign to edit win / lose weights. Totals must equal 100% — the backend applies these rules when resolving spins."
    >
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Campaign selector</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a campaign to open its probability editor.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <label
              htmlFor="prob-cfg-campaign"
              className="block text-xs font-medium text-slate-600"
            >
              Campaign
            </label>
            <select
              id="prob-cfg-campaign"
              value={selectedId}
              onChange={(e) => onCampaignDropdownChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Select campaign…</option>
              {campaigns.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} (#{c.id})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={goToCampaign}
            disabled={!Number.isFinite(numericSelection) || loading}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open editor
          </button>
        </div>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading campaigns…
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">All campaigns</h2>
        <p className="mt-1 text-sm text-slate-500">
          Quick links to the probability editor per campaign.
        </p>
        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Name
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Probability
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {campaigns.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-slate-800">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/probability-config/${c.id}`}
                        className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                      >
                        Configure
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DataTableContent>
  );
}
