export type LeadReceipt = {
  id: number;
  leadId: number;
  userId: number | null;
  imageUrl: string;
  receiptNumber: string;
  fileType: string;
  hash: string;
  pHash: string | null;
  isUsed: boolean;
  createdAt: string;
};

export type LeadProfile = {
  id: number;
  name: string;
  phone: string;
  email: string;
  shopLocation: string;
  address: string;
  campaignId: number;
  qrMappingId: number;
  acceptTerms: boolean;
  createdAt: string;
  updatedAt: string;
  receipts: LeadReceipt[];
};

export type LeadsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type LeadsListResult = {
  items: LeadProfile[];
  pagination: LeadsPagination;
};

export type LeadsListParams = {
  page: number;
  limit: number;
  search?: string;
  campaignId?: number;
};
