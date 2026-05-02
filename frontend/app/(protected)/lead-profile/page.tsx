"use client";

import DataTableContent from "@/components/Slice/UI/DataTableContent";
import LeadProfilesTable from "./_components/LeadProfilesTable";

export default function LeadProfilePage() {
  return (
    <DataTableContent title="Lead Profile" description="Manage campaign leads">
      <LeadProfilesTable />
    </DataTableContent>
  );
}
