export type CampaignStatus = "ACTIVE" | "INACTIVE";

export interface Product {
  id: number;
  name: string;
}

export interface Campaign {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  products?: Product[];
  createdAt?: string;
  updatedAt?: string;
}

export type CampaignsListParams = {
  page: number;
  limit: number;
  search?: string;
  /** Omit or `"ALL"` to request all statuses (no `status` query param). */
  status?: CampaignStatus | "ALL";
};

export type CampaignsListResult = {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
};

export interface CreateCampaignPayload {
  name: string;
  startDate: string;
  endDate: string;
  status?: CampaignStatus;
}

export interface CampaignFormValues {
  name: string;
  startDate: string;
  endDate: string;
  productIds: number[];
  status: CampaignStatus;
}

export interface MapProductsPayload {
  productIds: number[];
  /** When true, replaces the campaign’s product set with `productIds`. */
  replaceExisting?: boolean;
}

export interface CampaignLandingDetails {
  title: string;
  subtitle?: string;
  offer?: string;
  brandLogos?: string[];
  prizes?: string[];
}
