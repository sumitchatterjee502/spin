"use client";

import DataTableContent from "@/components/Slice/UI/DataTableContent";
import RolesTable from "./_components/RolesTable";

export default function RolesPage() {
  return (
    <DataTableContent title="Roles" description="Manage role permissions">
      <RolesTable />
    </DataTableContent>
  );
}
