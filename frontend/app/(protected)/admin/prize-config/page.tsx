"use client";

import Link from "next/link";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import PrizeConfigCampaignsTable from "@/components/prize-config/PrizeConfigCampaignsTable";

export default function AdminPrizeConfigIndexPage() {
  return (
    <DataTableContent
      title="Prize configuration"
      description="Map catalog products to wheel prizes, set stock, and define distribution limits per campaign."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-600">
          Choose a campaign to edit an existing configuration, or start a new one.
            
          path.
        </p>
        <Link
          href="/admin/prize-config/create"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New configuration
        </Link>
      </div>
      <PrizeConfigCampaignsTable />
    </DataTableContent>
  );
}
