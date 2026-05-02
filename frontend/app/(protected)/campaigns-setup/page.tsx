"use client";

import Link from "next/link";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import CampaignsTable from "@/components/campaign/CampaignsTable";

export default function CampaignsPage() {
  return (
    <DataTableContent
      title="Campaigns"
      description="Manage spin wheel campaigns and product mapping."
    >
      <div className="mb-4 flex justify-end">
        <Link
          href="/campaigns-setup/create"
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create campaign
        </Link>
      </div>
      <CampaignsTable />
    </DataTableContent>
  );
}
