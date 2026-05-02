"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { listCampaignsPaginated } from "@/services/campaign.service";
import type { Campaign, CampaignStatus } from "@/types/campaign.types";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { formatCampaignDate } from "@/utils/formatCampaignDate";

export default function PrizeConfigCampaignsTable() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CampaignStatus>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setPage(1);
    });
  }, [debouncedSearch, statusFilter, pageSize]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      setLoading(true);
      try {
        const res = await listCampaignsPaginated(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            status: statusFilter,
          },
          session?.accessToken
        );
        if (!cancelled) {
          setCampaigns(res.campaigns);
          setTotal(res.total);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(getCampaignApiErrorMessage(e, "Failed to load campaigns."));
          setCampaigns([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken, page, pageSize, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  const rows = useMemo(
    () =>
      campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        start: formatCampaignDate(c.startDate),
        end: formatCampaignDate(c.endDate),
        status: c.status,
      })),
    [campaigns]
  );

  if (status === "unauthenticated") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        Sign in to view campaigns.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="prize-cfg-camp-search"
              className="block text-xs font-medium text-slate-600"
            >
              Search campaigns
            </label>
            <input
              id="prize-cfg-camp-search"
              type="search"
              placeholder="Search by name…"
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchInput(e.target.value)
              }
              className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="prize-cfg-camp-status"
              className="block text-xs font-medium text-slate-600"
            >
              Status
            </label>
            <select
              id="prize-cfg-camp-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
          No campaigns match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Start
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  End
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Prize config
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-slate-800">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.start}</td>
                  <td className="px-4 py-3 text-slate-600">{r.end}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "ACTIVE"
                          ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          : "rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/prize-config/edit/${r.id}`}
                      className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                    >
                      Configure
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:flex-row">
          <div>
            Page {page} of {totalPages}
            <span className="mx-2 text-slate-300">|</span>
            <label className="inline-flex items-center gap-2">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
