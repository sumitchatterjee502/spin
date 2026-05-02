"use client";

import DataTableContent from "@/components/Slice/UI/DataTableContent";
import CampaignForm from "@/components/campaign/CampaignForm";
import type { CampaignFormValues } from "@/types/campaign.types";

const initialValues: CampaignFormValues = {
  name: "",
  startDate: "",
  endDate: "",
  productIds: [],
  status: "ACTIVE",
};

export default function CreateCampaignPage() {
  return (
    <DataTableContent
      title="Create campaign"
      description="Define dates, status, and linked products. All fields are required except toggling status."
    >
      <CampaignForm mode="create" initialValues={initialValues} syncKey="create" />
    </DataTableContent>
  );
}
