"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import QrFrontendUrlSettingsCard from "@/components/qr/QrFrontendUrlSettingsCard";
import QRMappingTable from "@/components/qr/QRMappingTable";
import { listCampaigns } from "@/services/campaign.service";
import {
  deleteQRMapping,
  getQRMappings,
} from "@/services/qr.service";
import type { QRMapping } from "@/types/qr.types";
import type { Campaign } from "@/types/campaign.types";
import { getQrApiErrorMessage } from "@/utils/qrApiError";

export default function AdminQrMappingIndexPage() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [rows, setRows] = useState<QRMapping[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [list, camps] = await Promise.all([
        getQRMappings(accessToken),
        listCampaigns(accessToken),
      ]);
      setRows(list);
      setCampaigns(camps);
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to load QR mappings."));
      setRows([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    void load();
  }, [status, accessToken, load]);

  const enrichedRows = useMemo(() => {
    const nameById = new Map(campaigns.map((c) => [c.id, c.name]));
    return rows.map((r) => ({
      ...r,
      campaignName: r.campaignName ?? nameById.get(r.campaignId),
    }));
  }, [rows, campaigns]);

  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    setDeletingId(id);
    try {
      await deleteQRMapping(id, accessToken);
      toast.success("QR mapping deleted");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      toast.error(getQrApiErrorMessage(e, "Failed to delete mapping."));
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "unauthenticated") {
    return (
      <DataTableContent title="QR code mapping" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
          Sign in to manage QR mappings.
        </div>
      </DataTableContent>
    );
  }

  return (
    <DataTableContent
      title="QR code mapping"
      description="Link printed QR codes to campaigns. Each scan resolves to your public campaign landing URL."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-600">
          
        </p>
        <Link
          href="/admin/qr-mapping/create"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New mapping
        </Link>
      </div>

      {accessToken ? (
        <QrFrontendUrlSettingsCard accessToken={accessToken} />
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">All mappings</h3>
        <p className="mt-1 text-xs text-slate-500">
          Table: QR code, campaign, encoded URL, and actions.
        </p>
        <div className="mt-3">
          <QRMappingTable
            rows={enrichedRows}
            loading={loading || status === "loading"}
            deletingId={deletingId}
            onDelete={handleDelete}
          />
        </div>
      </section>
    </DataTableContent>
  );
}
