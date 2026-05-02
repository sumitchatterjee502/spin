"use client";

import DataTableContent from "@/components/Slice/UI/DataTableContent";
import PermissionsTable from "./_components/PermissionsTable";

export default function PermissionManagementsPage() {
  return (
    <DataTableContent
      title="Permissions"
      description="View and create RBAC permission keys"
    >
      <PermissionsTable />
    </DataTableContent>
  );
}
