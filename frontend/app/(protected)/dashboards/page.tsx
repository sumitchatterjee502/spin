"use client";
import DataTableContent from "@/components/Slice/UI/DataTableContent";
import { useSession } from "next-auth/react";

export default function DashboardsPage() {
  const { data: session } = useSession();

  console.log(session);
  return (
    <DataTableContent title="Dashboards" description="Overview of admin metrics">
      <p className="text-sm text-slate-600 sm:text-base">
        Welcome to the admin dashboards module.
      </p>
    </DataTableContent>
  );
}
